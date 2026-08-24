import MenuDisclaimerModel from '@/models/menuDisclaimers.model';
import MenuDisclaimerService from '@/services/menuDisclaimers.service';
import { CreateMenuDisclaimersInterface, EditMenuDisclaimersInterface, MenuDisclaimerDBInterface } from '@/interfaces/disclaimers.interface';
import { PostgresQueriesRepository } from '@/entities/repositories/postgres.repository';
import { getErrorPayload, HttpException, InternalErrorCode } from '@/exceptions/HttpException';
import { EntityManager } from 'typeorm';
import { MenuDisclaimerEntity } from '@/entities/disclaimer.entity';
import { ormConnection } from '@/utils/dbUtils';

jest.mock('@/utils/imageUtils', () => require('../../../../__mocks__/imageUtils'));
jest.mock('@/models/menuDisclaimers.model', () => {
  const mockDisclaimerModel = {
    getAllMenuDisclaimersEntityByMenuID: jest.fn(),
    getMenuDisclaimerByIDAndMenuID: jest.fn(),
    getMenuDisclaimerType: jest.fn(),
    insertMenuDisclaimers: jest.fn(),
    updateMenuDisclaimerMessage: jest.fn(),
    deleteMenuDisclaimers: jest.fn(),
    updateMenuDisclaimers: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockDisclaimerModel) };
});
jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, logger: logger };
});
jest.mock('@/utils/dbUtils', () => {
  return {
    __esModule: true,
    ormConnection: jest.fn(),
  };
});
// create mock disclaimers model object
const mockDisclaimerModel = new MenuDisclaimerModel();
const disclaimerService = new MenuDisclaimerService(mockDisclaimerModel);

describe('MenuDisclaimersService', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('insertMenuDisclaimers', () => {
    const menuDisclaimers: CreateMenuDisclaimersInterface[] = [
      {
        message: 'TEST',
        position: 'menu top bar',
      },
    ];
    const menuID = 1;
    const mockGetMenuDisclaimerType = {
      message_type_id: 1,
    };
    it('should successfully create menu disclaimers', async () => {
      // mock model response
      const mockMenuDisclaimerResponse: MenuDisclaimerDBInterface[] = [
        {
          message_id: 1,
          message_type_id: 1,
          message: 'TEST',
          menu_id: menuID,
        },
      ];

      // set up mock disclaimers model to return our mock response to service
      (mockDisclaimerModel.getMenuDisclaimerType as jest.MockedFunction<any>).mockResolvedValueOnce(mockGetMenuDisclaimerType);
      (mockDisclaimerModel.insertMenuDisclaimers as jest.MockedFunction<any>).mockResolvedValueOnce(mockMenuDisclaimerResponse);

      // call on the service like the controller would
      const result = await disclaimerService.insertMenuDisclaimers(menuDisclaimers, menuID, {} as PostgresQueriesRepository);
      // enforce test expectations
      expect(mockDisclaimerModel.getMenuDisclaimerType).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockMenuDisclaimerResponse);
    });
    it('should throw a HttpException if any error occurs while inserting menu disclaimer', async () => {
      (mockDisclaimerModel.getMenuDisclaimerType as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await disclaimerService.insertMenuDisclaimers(menuDisclaimers, menuID, {} as PostgresQueriesRepository);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(mockDisclaimerModel.getMenuDisclaimerType).toHaveBeenCalledTimes(1);
    });
  });
  describe('deleteMenuDisclaimers', () => {
    const DISCLAIMER_IDS = [1, 2, 3];
    const MENU_ID = 1;
    it('should successfully delete menu disclaimer message', async () => {
      (mockDisclaimerModel.deleteMenuDisclaimers as jest.MockedFunction<any>).mockResolvedValueOnce(true);

      await disclaimerService.deleteMenuDisclaimers(DISCLAIMER_IDS, MENU_ID, {} as EntityManager);

      expect(mockDisclaimerModel.deleteMenuDisclaimers).toHaveBeenCalledTimes(1);
    });
    it('should throw a HttpException if any error occurs while deleting menu disclaimer', async () => {
      (mockDisclaimerModel.deleteMenuDisclaimers as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await disclaimerService.deleteMenuDisclaimers(DISCLAIMER_IDS, MENU_ID, {} as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(mockDisclaimerModel.deleteMenuDisclaimers).toHaveBeenCalledTimes(1);
    });
  });
  describe('editMenuDisclaimers', () => {
    const MENU_ID = 1;
    const emptyInsertedDisclaimerResponse = {
      insertedDisclaimers: [],
    };
    const insertDisclaimerResponseBottomMenuBar = {
      insertedDisclaimers: [
        {
          position: 'menu bottom bar',
          message: 'bottom disclaimer',
          messageID: 3,
        },
      ],
    };
    const insertDisclaimerResponseTopMenuBar = {
      insertedDisclaimers: [
        {
          position: 'menu top bar',
          message: 'top disclaimer',
          messageID: 3,
        },
      ],
    };
    it('should successfully edit disclaimer by deleting old disclaimer and creating new disclaimer message in SAME position (menu bottom bar)', async () => {
      const menuDisclaimers: EditMenuDisclaimersInterface = {
        DELETE: [2],
        INSERT: [
          {
            message: 'bottom disclaimer',
            position: 'menu bottom bar',
          },
        ],
        UPDATE: [],
      };
      // mock model response
      const mockMenuDisclaimerResponseAlreadyExists: MenuDisclaimerEntity[] = [
        {
          message_id: 2,
          message_type_id: 2,
          message: 'bottom disclaimer',
          menu_id: MENU_ID,
        },
      ];

      const mockMenuDisclaimerResponse: MenuDisclaimerEntity[] = [
        {
          message_id: 3,
          message_type_id: 2,
          message: 'bottom disclaimer',
          menu_id: MENU_ID,
        },
      ];

      // set up mock disclaimers model to return our mock response to service
      (mockDisclaimerModel.getAllMenuDisclaimersEntityByMenuID as jest.MockedFunction<any>).mockResolvedValueOnce(
        mockMenuDisclaimerResponseAlreadyExists,
      );
      (mockDisclaimerModel.deleteMenuDisclaimers as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);
      (mockDisclaimerModel.getMenuDisclaimerType as jest.MockedFunction<any>).mockResolvedValueOnce(mockMenuDisclaimerResponse);
      (mockDisclaimerModel.insertMenuDisclaimers as jest.MockedFunction<any>).mockResolvedValueOnce(mockMenuDisclaimerResponse);

      const insert = jest.fn().mockResolvedValue({ raw: [mockMenuDisclaimerResponse] });
      const CUSTOM_REPOSITORY: any = {
        insert,
      };
      const REPOSITORY: any = {
        getCustomRepository: () => CUSTOM_REPOSITORY,
      };

      // call on the service like the controller would
      const result = await disclaimerService.editMenuDisclaimers(menuDisclaimers, MENU_ID, REPOSITORY as EntityManager);
      // enforce test expectations
      expect(mockDisclaimerModel.getAllMenuDisclaimersEntityByMenuID).toHaveBeenCalledTimes(1);
      expect(mockDisclaimerModel.deleteMenuDisclaimers).toHaveBeenCalledTimes(1);
      expect(mockDisclaimerModel.getMenuDisclaimerType).toHaveBeenCalledTimes(1);
      expect(mockDisclaimerModel.insertMenuDisclaimers).toHaveBeenCalledTimes(1);
      expect(mockDisclaimerModel.updateMenuDisclaimers).not.toHaveBeenCalled();

      expect(result).toEqual(insertDisclaimerResponseBottomMenuBar);
    });
    it('should successfully edit disclaimer by deleting old disclaimer and creating new disclaimer message in DIFFERENT positions', async () => {
      const menuDisclaimers: EditMenuDisclaimersInterface = {
        DELETE: [2],
        INSERT: [
          {
            message: 'INSERT top disclaimer',
            position: 'menu top bar',
          },
        ],
        UPDATE: [],
      };
      // mock model response
      const mockMenuDisclaimerResponseAlreadyExists: MenuDisclaimerEntity[] = [
        {
          message_id: 2,
          message_type_id: 2,
          message: 'bottom disclaimer',
          menu_id: MENU_ID,
        },
      ];

      const mockMenuDisclaimerResponse: MenuDisclaimerEntity[] = [
        {
          message_id: 3,
          message_type_id: 1,
          message: 'top disclaimer',
          menu_id: MENU_ID,
        },
      ];

      // set up mock disclaimers model to return our mock response to service
      (mockDisclaimerModel.getAllMenuDisclaimersEntityByMenuID as jest.MockedFunction<any>).mockResolvedValueOnce(
        mockMenuDisclaimerResponseAlreadyExists,
      );
      (mockDisclaimerModel.deleteMenuDisclaimers as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);
      (mockDisclaimerModel.getMenuDisclaimerType as jest.MockedFunction<any>).mockResolvedValueOnce(mockMenuDisclaimerResponse);
      (mockDisclaimerModel.insertMenuDisclaimers as jest.MockedFunction<any>).mockResolvedValueOnce(mockMenuDisclaimerResponse);

      const insert = jest.fn().mockResolvedValue({ raw: [mockMenuDisclaimerResponse] });
      const CUSTOM_REPOSITORY: any = {
        insert,
      };
      const REPOSITORY: any = {
        getCustomRepository: () => CUSTOM_REPOSITORY,
      };

      // call on the service like the controller would
      const result = await disclaimerService.editMenuDisclaimers(menuDisclaimers, MENU_ID, REPOSITORY as EntityManager);
      // enforce test expectations

      expect(mockDisclaimerModel.getAllMenuDisclaimersEntityByMenuID).toHaveBeenCalledTimes(1);
      expect(mockDisclaimerModel.deleteMenuDisclaimers).toHaveBeenCalledTimes(1);
      expect(mockDisclaimerModel.getMenuDisclaimerType).toHaveBeenCalledTimes(1);
      expect(mockDisclaimerModel.insertMenuDisclaimers).toHaveBeenCalledTimes(1);
      expect(mockDisclaimerModel.updateMenuDisclaimers).not.toHaveBeenCalled();

      expect(result).toEqual(insertDisclaimerResponseTopMenuBar);
    });
    it('should successfully edit disclaimer by deleting old disclaimers', async () => {
      const mockMenuDisclaimerResponse: MenuDisclaimerEntity[] = [
        {
          message_id: 1,
          message_type_id: 1,
          message: 'top disclaimer',
          menu_id: MENU_ID,
        },
        {
          message_id: 2,
          message_type_id: 2,
          message: 'bottom disclaimer',
          menu_id: MENU_ID,
        },
      ];
      const menuDisclaimers: EditMenuDisclaimersInterface = {
        DELETE: [1, 2],
        INSERT: [],
        UPDATE: [],
      };
      // mock model response
      // set up mock disclaimers model to return our mock response to service
      (mockDisclaimerModel.getAllMenuDisclaimersEntityByMenuID as jest.MockedFunction<any>).mockResolvedValueOnce(mockMenuDisclaimerResponse);
      (mockDisclaimerModel.deleteMenuDisclaimers as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);

      // call on the service like the controller would
      const result = await disclaimerService.editMenuDisclaimers(menuDisclaimers, MENU_ID, {} as EntityManager);
      // enforce test expectations

      expect(mockDisclaimerModel.getAllMenuDisclaimersEntityByMenuID).toHaveBeenCalledTimes(1);
      expect(mockDisclaimerModel.deleteMenuDisclaimers).toHaveBeenCalledTimes(1);
      expect(mockDisclaimerModel.insertMenuDisclaimers).not.toHaveBeenCalled();
      expect(mockDisclaimerModel.updateMenuDisclaimers).not.toHaveBeenCalled();

      expect(result).toEqual(emptyInsertedDisclaimerResponse);
    });
    it('should successfully edit disclaimer by deleting old disclaimer and updating a different position other disclaimer', async () => {
      const mockMenuDisclaimerResponse: MenuDisclaimerEntity[] = [
        {
          message_id: 1,
          message_type_id: 1,
          message: 'top disclaimer',
          menu_id: MENU_ID,
        },
        {
          message_id: 2,
          message_type_id: 2,
          message: 'bottom disclaimer',
          menu_id: MENU_ID,
        },
      ];
      const menuDisclaimers: EditMenuDisclaimersInterface = {
        DELETE: [1],
        INSERT: [],
        UPDATE: [
          {
            message: 'update bottom disclaimer',
            messageID: 2,
          },
        ],
      };
      // mock model response
      // set up mock disclaimers model to return our mock response to service
      (mockDisclaimerModel.getAllMenuDisclaimersEntityByMenuID as jest.MockedFunction<any>).mockResolvedValueOnce(mockMenuDisclaimerResponse);
      (mockDisclaimerModel.deleteMenuDisclaimers as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);
      (mockDisclaimerModel.updateMenuDisclaimers as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);

      // call on the service like the controller would
      const result = await disclaimerService.editMenuDisclaimers(menuDisclaimers, MENU_ID, {} as EntityManager);
      // enforce test expectations

      expect(mockDisclaimerModel.getAllMenuDisclaimersEntityByMenuID).toHaveBeenCalledTimes(1);
      expect(mockDisclaimerModel.deleteMenuDisclaimers).toHaveBeenCalledTimes(1);
      expect(mockDisclaimerModel.updateMenuDisclaimers).toHaveBeenCalledTimes(1);
      expect(mockDisclaimerModel.insertMenuDisclaimers).not.toHaveBeenCalled();

      expect(result).toEqual(emptyInsertedDisclaimerResponse);
    });
    it('should successfully edit disclaimer by inserting a disclaimer and updating a different position other disclaimer', async () => {
      const mockMenuDisclaimerResponseAlreadyExist: MenuDisclaimerEntity[] = [
        {
          message_id: 2,
          message_type_id: 2,
          message: 'bottom disclaimer',
          menu_id: MENU_ID,
        },
      ];
      const mockInsertedMenuDisclaimerResponse: MenuDisclaimerEntity[] = [
        {
          message_id: 3,
          message_type_id: 1,
          message: 'top disclaimer',
          menu_id: MENU_ID,
        },
      ];
      const menuDisclaimers: EditMenuDisclaimersInterface = {
        DELETE: [],
        INSERT: [
          {
            message: 'insert top disclaimer',
            position: 'menu top bar',
          },
        ],
        UPDATE: [
          {
            message: 'update bottom disclaimer',
            messageID: 2,
          },
        ],
      };
      // mock model response
      // set up mock disclaimers model to return our mock response to service
      (mockDisclaimerModel.getAllMenuDisclaimersEntityByMenuID as jest.MockedFunction<any>).mockResolvedValueOnce(
        mockMenuDisclaimerResponseAlreadyExist,
      );
      (mockDisclaimerModel.updateMenuDisclaimers as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);
      (mockDisclaimerModel.getMenuDisclaimerType as jest.MockedFunction<any>).mockResolvedValueOnce(mockInsertedMenuDisclaimerResponse);
      (mockDisclaimerModel.insertMenuDisclaimers as jest.MockedFunction<any>).mockResolvedValueOnce(mockInsertedMenuDisclaimerResponse);

      const insert = jest.fn().mockResolvedValue({ raw: [mockInsertedMenuDisclaimerResponse] });
      const CUSTOM_REPOSITORY: any = {
        insert,
      };
      const REPOSITORY: any = {
        getCustomRepository: () => CUSTOM_REPOSITORY,
      };
      // call on the service like the controller would
      const result = await disclaimerService.editMenuDisclaimers(menuDisclaimers, MENU_ID, REPOSITORY as EntityManager);
      // enforce test expectations

      expect(mockDisclaimerModel.getAllMenuDisclaimersEntityByMenuID).toHaveBeenCalledTimes(1);
      expect(mockDisclaimerModel.updateMenuDisclaimers).toHaveBeenCalledTimes(1);
      expect(mockDisclaimerModel.getMenuDisclaimerType).toHaveBeenCalledTimes(1);
      expect(mockDisclaimerModel.insertMenuDisclaimers).toHaveBeenCalledTimes(1);
      expect(mockDisclaimerModel.deleteMenuDisclaimers).not.toHaveBeenCalled();

      expect(result).toEqual(insertDisclaimerResponseTopMenuBar);
    });
    it('should successfully edit disclaimer by inserting a disclaimer', async () => {
      const mockMenuDisclaimerResponseAlreadyExist: MenuDisclaimerEntity[] = [
        {
          message_id: 2,
          message_type_id: 2,
          message: 'bottom disclaimer',
          menu_id: MENU_ID,
        },
      ];
      const mockInsertedMenuDisclaimerResponse: MenuDisclaimerEntity[] = [
        {
          message_id: 3,
          message_type_id: 1,
          message: 'top disclaimer',
          menu_id: MENU_ID,
        },
      ];
      const menuDisclaimers: EditMenuDisclaimersInterface = {
        DELETE: [],
        INSERT: [
          {
            message: 'insert top disclaimer',
            position: 'menu top bar',
          },
        ],
        UPDATE: [],
      };
      // mock model response
      // set up mock disclaimers model to return our mock response to service
      (mockDisclaimerModel.getAllMenuDisclaimersEntityByMenuID as jest.MockedFunction<any>).mockResolvedValueOnce(
        mockMenuDisclaimerResponseAlreadyExist,
      );
      (mockDisclaimerModel.getMenuDisclaimerType as jest.MockedFunction<any>).mockResolvedValueOnce(mockInsertedMenuDisclaimerResponse);
      (mockDisclaimerModel.insertMenuDisclaimers as jest.MockedFunction<any>).mockResolvedValueOnce(mockInsertedMenuDisclaimerResponse);

      const insert = jest.fn().mockResolvedValue({ raw: [mockInsertedMenuDisclaimerResponse] });
      const CUSTOM_REPOSITORY: any = {
        insert,
      };
      const REPOSITORY: any = {
        getCustomRepository: () => CUSTOM_REPOSITORY,
      };
      // call on the service like the controller would
      const result = await disclaimerService.editMenuDisclaimers(menuDisclaimers, MENU_ID, REPOSITORY as EntityManager);
      // enforce test expectations

      expect(mockDisclaimerModel.getAllMenuDisclaimersEntityByMenuID).toHaveBeenCalledTimes(1);
      expect(mockDisclaimerModel.getMenuDisclaimerType).toHaveBeenCalledTimes(1);
      expect(mockDisclaimerModel.insertMenuDisclaimers).toHaveBeenCalledTimes(1);
      expect(mockDisclaimerModel.deleteMenuDisclaimers).not.toHaveBeenCalled();
      expect(mockDisclaimerModel.updateMenuDisclaimers).not.toHaveBeenCalled();

      expect(result).toEqual(insertDisclaimerResponseTopMenuBar);
    });
    it('should successfully edit disclaimer by updating a disclaimer', async () => {
      const mockMenuDisclaimerResponseAlreadyExist: MenuDisclaimerEntity[] = [
        {
          message_id: 2,
          message_type_id: 2,
          message: 'bottom disclaimer',
          menu_id: MENU_ID,
        },
      ];
      const menuDisclaimers: EditMenuDisclaimersInterface = {
        DELETE: [],
        INSERT: [],
        UPDATE: [
          {
            messageID: 2,
            message: 'update bottom disclaimer',
          },
        ],
      };
      // mock model response
      // set up mock disclaimers model to return our mock response to service
      (mockDisclaimerModel.getAllMenuDisclaimersEntityByMenuID as jest.MockedFunction<any>).mockResolvedValueOnce(
        mockMenuDisclaimerResponseAlreadyExist,
      );
      (mockDisclaimerModel.updateMenuDisclaimers as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);

      // call on the service like the controller would
      const result = await disclaimerService.editMenuDisclaimers(menuDisclaimers, MENU_ID, {} as EntityManager);
      // enforce test expectations

      expect(mockDisclaimerModel.getAllMenuDisclaimersEntityByMenuID).toHaveBeenCalledTimes(1);
      expect(mockDisclaimerModel.updateMenuDisclaimers).toHaveBeenCalledTimes(1);
      expect(mockDisclaimerModel.deleteMenuDisclaimers).not.toHaveBeenCalled();
      expect(mockDisclaimerModel.insertMenuDisclaimers).not.toHaveBeenCalled();

      expect(result).toEqual(emptyInsertedDisclaimerResponse);
    });
    it('should successfully edit disclaimer by deleting an old disclaimer, inserting a new disclaimer in same position as old,  and updating a different position of another disclaimer', async () => {
      const mockMenuDisclaimerResponseAlreadyExist: MenuDisclaimerEntity[] = [
        {
          message_id: 1,
          message_type_id: 1,
          message: 'top disclaimer',
          menu_id: MENU_ID,
        },
        {
          message_id: 2,
          message_type_id: 2,
          message: 'bottom disclaimer',
          menu_id: MENU_ID,
        },
      ];
      const mockInsertedMenuDisclaimerResponse: MenuDisclaimerEntity[] = [
        {
          message_id: 3,
          message_type_id: 2,
          message: 'bottom disclaimer',
          menu_id: MENU_ID,
        },
      ];
      const menuDisclaimers: EditMenuDisclaimersInterface = {
        DELETE: [2],
        INSERT: [
          {
            message: 'insert bottom disclaimer',
            position: 'menu bottom bar',
          },
        ],
        UPDATE: [
          {
            message: 'update top disclaimer',
            messageID: 1,
          },
        ],
      };
      // mock model response
      // set up mock disclaimers model to return our mock response to service
      (mockDisclaimerModel.getAllMenuDisclaimersEntityByMenuID as jest.MockedFunction<any>).mockResolvedValueOnce(
        mockMenuDisclaimerResponseAlreadyExist,
      );
      (mockDisclaimerModel.updateMenuDisclaimers as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);
      (mockDisclaimerModel.getMenuDisclaimerType as jest.MockedFunction<any>).mockResolvedValueOnce(mockInsertedMenuDisclaimerResponse);
      (mockDisclaimerModel.insertMenuDisclaimers as jest.MockedFunction<any>).mockResolvedValueOnce(mockInsertedMenuDisclaimerResponse);

      const insert = jest.fn().mockResolvedValue({ raw: [mockInsertedMenuDisclaimerResponse] });
      const CUSTOM_REPOSITORY: any = {
        insert,
      };
      const REPOSITORY: any = {
        getCustomRepository: () => CUSTOM_REPOSITORY,
      };
      // call on the service like the controller would
      const result = await disclaimerService.editMenuDisclaimers(menuDisclaimers, MENU_ID, REPOSITORY as EntityManager);
      // enforce test expectations

      expect(mockDisclaimerModel.getAllMenuDisclaimersEntityByMenuID).toHaveBeenCalledTimes(1);
      expect(mockDisclaimerModel.deleteMenuDisclaimers).toHaveBeenCalledTimes(1);
      expect(mockDisclaimerModel.updateMenuDisclaimers).toHaveBeenCalledTimes(1);
      expect(mockDisclaimerModel.getMenuDisclaimerType).toHaveBeenCalledTimes(1);
      expect(mockDisclaimerModel.insertMenuDisclaimers).toHaveBeenCalledTimes(1);

      expect(result).toEqual(insertDisclaimerResponseBottomMenuBar);
    });
    it('should successfully handle empty disclaimer edit (all empty arrays)', async () => {
      const mockMenuDisclaimerResponseAlreadyExist: MenuDisclaimerEntity[] = [
        {
          message_id: 2,
          message_type_id: 2,
          message: 'bottom disclaimer',
          menu_id: MENU_ID,
        },
      ];
      const menuDisclaimers: EditMenuDisclaimersInterface = {
        DELETE: [],
        INSERT: [],
        UPDATE: [],
      };
      // mock model response
      // set up mock disclaimers model to return our mock response to service
      (mockDisclaimerModel.getAllMenuDisclaimersEntityByMenuID as jest.MockedFunction<any>).mockResolvedValueOnce(
        mockMenuDisclaimerResponseAlreadyExist,
      );

      // call on the service like the controller would
      const result = await disclaimerService.editMenuDisclaimers(menuDisclaimers, MENU_ID, {} as EntityManager);
      // enforce test expectations

      expect(mockDisclaimerModel.getAllMenuDisclaimersEntityByMenuID).toHaveBeenCalledTimes(1);

      expect(result).toEqual(emptyInsertedDisclaimerResponse);
      expect(mockDisclaimerModel.insertMenuDisclaimers).not.toHaveBeenCalled();
      expect(mockDisclaimerModel.updateMenuDisclaimers).not.toHaveBeenCalled();
      expect(mockDisclaimerModel.deleteMenuDisclaimers).not.toHaveBeenCalled();
    });
    it('should throw a HttpException if any error occurs while editing menu disclaimer', async () => {
      const menuDisclaimers: EditMenuDisclaimersInterface = {
        DELETE: [2],
        INSERT: [
          {
            message: 'INSERT disclaimer',
            position: 'menu top bar',
          },
        ],
        UPDATE: [
          {
            message: 'UPDATE bottom disclaimer',
            messageID: 1,
          },
        ],
      };

      (mockDisclaimerModel.getAllMenuDisclaimersEntityByMenuID as jest.MockedFunction<any>).mockImplementationOnce(() => {
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while editing menu disclaimers for menu: ${MENU_ID}. Refer to the logs for more detail.`,
          ),
        );
      });

      try {
        await disclaimerService.editMenuDisclaimers(menuDisclaimers, MENU_ID, {} as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
    it('should throw a HttpException 409 if DELETE and UPDATE have same id of a disclaimer', async () => {
      const menuDisclaimers: EditMenuDisclaimersInterface = {
        DELETE: [2],
        INSERT: [
          {
            message: 'INSERT disclaimer',
            position: 'menu top bar',
          },
        ],
        UPDATE: [
          {
            message: 'UPDATE bottom disclaimer',
            messageID: 2,
          },
        ],
      };

      try {
        await disclaimerService.editMenuDisclaimers(menuDisclaimers, MENU_ID, {} as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(409);
        expect(err.payload instanceof HttpException);
      }
    });
    it('should throw a HttpException 404 if UPDATE has an id of a disclaimer that does not exist in the database', async () => {
      const menuDisclaimers: EditMenuDisclaimersInterface = {
        DELETE: [1],
        INSERT: [],
        UPDATE: [
          {
            message: 'UPDATE bottom disclaimer',
            messageID: 2,
          },
        ],
      };
      const mockMenuDisclaimerResponseAlreadyExist: MenuDisclaimerEntity[] = [
        {
          message_id: 1,
          message_type_id: 1,
          message: 'top disclaimer',
          menu_id: MENU_ID,
        },
      ];
      (mockDisclaimerModel.getAllMenuDisclaimersEntityByMenuID as jest.MockedFunction<any>).mockResolvedValueOnce(
        mockMenuDisclaimerResponseAlreadyExist,
      );

      try {
        await disclaimerService.editMenuDisclaimers(menuDisclaimers, MENU_ID, {} as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(404);
        expect(err.payload instanceof HttpException);
      }
    });
    it('should throw a HttpException 404 if DELETE has an id of a disclaimer that does not exist in the database', async () => {
      const menuDisclaimers: EditMenuDisclaimersInterface = {
        DELETE: [1],
        INSERT: [],
        UPDATE: [
          {
            message: 'UPDATE bottom disclaimer',
            messageID: 2,
          },
        ],
      };
      const mockMenuDisclaimerResponseAlreadyExist: MenuDisclaimerEntity[] = [
        {
          message_id: 2,
          message_type_id: 2,
          message: 'bottom disclaimer',
          menu_id: MENU_ID,
        },
      ];
      (mockDisclaimerModel.getAllMenuDisclaimersEntityByMenuID as jest.MockedFunction<any>).mockResolvedValueOnce(
        mockMenuDisclaimerResponseAlreadyExist,
      );

      try {
        await disclaimerService.editMenuDisclaimers(menuDisclaimers, MENU_ID, {} as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(404);
        expect(err.payload instanceof HttpException);
      }
    });
    it('should throw a HttpException 409 if INSERT attempts to insert in a position where a menu disclaimer already exists', async () => {
      const menuDisclaimers: EditMenuDisclaimersInterface = {
        DELETE: [1],
        INSERT: [
          {
            message: 'INSERT bottom disclaimer',
            position: 'menu bottom bar',
          },
        ],
        UPDATE: [],
      };
      const mockMenuDisclaimerResponseAlreadyExist: MenuDisclaimerEntity[] = [
        {
          message_id: 1,
          message_type_id: 1,
          message: 'top disclaimer',
          menu_id: MENU_ID,
        },
        {
          message_id: 2,
          message_type_id: 2,
          message: 'bottom disclaimer',
          menu_id: MENU_ID,
        },
      ];
      (mockDisclaimerModel.getAllMenuDisclaimersEntityByMenuID as jest.MockedFunction<any>).mockResolvedValueOnce(
        mockMenuDisclaimerResponseAlreadyExist,
      );

      try {
        await disclaimerService.editMenuDisclaimers(menuDisclaimers, MENU_ID, {} as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(409);
        expect(err.payload instanceof HttpException);
      }
    });
  });
  describe('getMenuDisclaimerByIDAndMenuID', () => {
    const MESSAGE_ID = 1;
    const MENU_ID = 1;
    it('should successfully get menu disclaimer by id and menu ID', async () => {
      (mockDisclaimerModel.getMenuDisclaimerByIDAndMenuID as jest.MockedFunction<any>).mockResolvedValueOnce(true);

      await disclaimerService.getMenuDisclaimerByIDAndMenuID(MESSAGE_ID, MENU_ID, {} as EntityManager);

      expect(mockDisclaimerModel.getMenuDisclaimerByIDAndMenuID).toHaveBeenCalledTimes(1);
    });
    it('should throw a HttpException if any error occurs while getting menu disclaimer by id and menuID', async () => {
      (mockDisclaimerModel.getMenuDisclaimerByIDAndMenuID as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await disclaimerService.getMenuDisclaimerByIDAndMenuID(MESSAGE_ID, MENU_ID, {} as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(mockDisclaimerModel.getMenuDisclaimerByIDAndMenuID).toHaveBeenCalledTimes(1);
    });
  });
  describe('getAllMenuDisclaimersByMenuID', () => {
    const MENU_ID = 1;
    const mockMenuDisclaimer = [
      {
        message: 'TEST TOP disclaimer',
        message_id: 1,
        message_type_id: 1,
        menu_id: 1,
      },
      {
        message: 'TEST BOTTOM disclaimer',
        message_id: 2,
        message_type_id: 2,
        menu_id: 1,
      },
    ];
    const mockMenuDisclaimerResult = [
      {
        message: 'TEST TOP disclaimer',
        messageID: 1,
        position: 'menu top bar',
        menuID: 1,
      },
      {
        message: 'TEST BOTTOM disclaimer',
        messageID: 2,
        position: 'menu bottom bar',
        menuID: 1,
      },
    ];
    it('should get all menu disclaimers by menu ID', async () => {
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce(true);

      (mockDisclaimerModel.getAllMenuDisclaimersEntityByMenuID as jest.MockedFunction<any>).mockResolvedValueOnce(mockMenuDisclaimer);

      const result = await disclaimerService.getAllMenuDisclaimersByMenuID(MENU_ID, {} as EntityManager);

      expect(mockDisclaimerModel.getAllMenuDisclaimersEntityByMenuID).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockMenuDisclaimerResult);
    });
    it('should throw a HttpException 500 status code if any error occurs while getting menu disclaimesr by menuID', async () => {
      (mockDisclaimerModel.getAllMenuDisclaimersEntityByMenuID as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error();
      });

      try {
        await disclaimerService.getAllMenuDisclaimersByMenuID(MENU_ID, {} as EntityManager);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
});
