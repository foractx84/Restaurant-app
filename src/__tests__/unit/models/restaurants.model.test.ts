import RestaurantsModel from '@/models/restaurants.model';
import { ormConnection, rawQuery } from '@/utils/dbUtils';
import { RestaurantEntity } from '@/entities/restaurant.entity';
import { HttpException } from '@exceptions/HttpException';

jest.mock('typeorm', () => require('../../../../__mocks__/typeorm'));
jest.mock('@/utils/imageUtils', () => require('../../../../__mocks__/imageUtils'));
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
    rawQuery: jest.fn(),
    ormConnection: jest.fn(),
  };
});

jest.mock('@/utils/imageUtils', () => require('../../../../__mocks__/imageUtils'));

const restaurantsModel = new RestaurantsModel();

describe('restaurantsModel', () => {
  const RESTAURANT = {
    restaurant_url_id: 'test',
    restaurant_id: 1,
    name: 'The Noho Kitchen',
    description: 'Traditional steakhouse fare is served in an ornate setting with a separate piano room & wine cellar.',
    email: 'NohoKitchen@nohokitchen.com',
    website: null,
    is_published: true,
    cuisine_id: {
      cuisine_id: 2,
      name: 'Spanish',
    },
    restaurant_address: {
      restaurant_address_id: 3,
      address1: '555 S Brannon St',
      address2: null,
      city: 'New York',
      governing_district: 'NY',
      country_id: {
        country_id: 1,
        name: 'United States',
        abbreviation: 'US',
        currency_code: 'USD',
      },
      postal_code: '10923',
      timezone: 'America/New_York',
    },
    images: [
      {
        restaurant_image_id: 3,
        image_url: '9abb6429-51bb-4876-9a29-8208712c1883.jpeg',
        restaurant_image_type_id: {
          restaurant_image_type_id: 1,
          type: 'profile',
        },
      },
    ],
    restaurant_menu_layouts: [
      {
        menu_layout_id: {
          menu_layout_id: 2,
          layout: 'grid no text',
        },
      },
    ],
    menus: [
      {
        name: 'Lunch',
        menu_id: 276,
        sections: [
          {
            menu_section_id: 1001,
            name: 'menu section 1',
            menu_id: 276,
            list_order: 0,
            deleted: false,
          },
        ],
        is_prix_fixe: false,
      },
    ],
  };
  const RESTAURANT_ENTITY = {
    name: 'Test Restaurant',
    description: 'test description',
    phone: '1112223333',
    email: 'test@email.com',
    cuisine_id: 1,
    website: 'test website',
    address: '123 fake street',
    city: 'New York',
    state: 'NY',
    zip: '12345',
    lat: 17.87508182685489,
    long: -17.48914886925735,
  };
  const RESTAURANT_DETAILS = {
    restaurant_url_id: 'test',
    restaurant_id: 1,
    name: 'The Noho Kitchen',
    description: 'Traditional steakhouse fare is served in an ornate setting with a separate piano room & wine cellar.',
    email: 'NohoKitchen@nohokitchen.com',
    website: null,
    is_published: true,
    cuisine_id: {
      cuisine_id: 2,
      name: 'Spanish',
    },
    restaurant_address: {
      restaurant_address_id: 3,
      address1: '555 S Brannon St',
      address2: null,
      city: 'New York',
      governing_district: 'NY',
      country_id: {
        country_id: 1,
        name: 'United States',
        abbreviation: 'US',
        currency_code: 'USD',
      },
      postal_code: '10923',
      timezone: 'America/New_York',
    },
    images: [
      {
        restaurant_image_id: 3,
        image_url: '9abb6429-51bb-4876-9a29-8208712c1883.jpeg',
        restaurant_image_type_id: {
          restaurant_image_type_id: 1,
          type: 'profile',
        },
      },
      {
        restaurant_image_id: 4,
        image_url: '9abb6429-51bb-4876-9a29-8208712c1883.jpeg',
        restaurant_image_type_id: {
          restaurant_image_type_id: 2,
          type: 'logo',
        },
      },
      {
        restaurant_image_id: 5,
        image_url: '9abb6429-51bb-4876-9a29-8208712c1883.jpeg',
        restaurant_image_type_id: {
          restaurant_image_type_id: 4,
          type: 'thumbnail',
        },
      },
      {
        restaurant_image_id: 6,
        image_url: '9abb6429-51bb-4876-9a29-8208712c1883.jpeg',
        restaurant_image_type_id: {
          restaurant_image_type_id: 5,
          type: 'cover_photo',
        },
      },
    ],
    restaurant_menu_layouts: [
      {
        menu_layout_id: {
          menu_layout_id: 2,
          layout: 'grid no text',
        },
      },
    ],
    menus: [
      {
        name: 'Lunch',
        menu_id: 276,
        sections: [
          {
            menu_section_id: 1001,
            name: 'menu section 1',
            menu_id: 276,
            list_order: 0,
            deleted: false,
          },
        ],
        is_prix_fixe: false,
      },
    ],
    socials: {
      restaurant_socials_id: 1,
      facebook: 'https://test.com',
      instagram: null,
      tiktok: null,
      snapchat: 'https://test2.com',
      twitter: null,
      restaurant_id: 1,
    },
    hours: [
      {
        restaurant_hours_id: 4,
        restaurant_id: 1,
        day: 'Tuesday',
        start: '11:00',
        end: '23:00',
      },
      {
        restaurant_hours_id: 16,
        restaurant_id: 1,
        day: 'Saturday',
        start: '11:00',
        end: '23:00',
      },
      {
        restaurant_hours_id: 19,
        restaurant_id: 1,
        day: 'Sunday',
        start: '11:00',
        end: '23:00',
      },
      {
        restaurant_hours_id: 1,
        restaurant_id: 1,
        day: 'Monday',
        start: '11:00',
        end: '23:00',
      },
    ],
    restaurant_profile_albums: [
      {
        restaurant_profile_album_id: 3,
        restaurant_id: 1,
        name: 'default',
        description: 'default gallery album used to display a single album in restaurant profile',
        list_order: 0,
        deleted_at: null,
        is_hidden: false,
        restaurant_profile_album_media: [
          {
            restaurant_profile_album_media_id: 12,
            restaurant_profile_album_id: 3,
            media_id: 18,
            list_order: 0,
            deleted_at: null,
            media: {
              media_type_id: 1,
              media_url: '6cb008e2-deae-40b2-a8f9-d0371a103ca3.jpeg',
              restaurant_id: 1,
              name: '6cb008e2-deae-40b2-a8f9-d0371a103ca3.jpeg',
              media_id: 18,
              description: null,
              deleted_at: null,
            },
          },
        ],
      },
    ],
    profilePages: [
      {
        pageID: 1,
        name: 'Noho_About_Page',
        isHidden: false,
      },
    ],
  };
  afterEach(() => {
    (rawQuery as jest.MockedFunction<any>).mockReset();
    (ormConnection as jest.MockedFunction<any>).mockReset();
  });

  describe('getRestaurantByID', () => {
    it('should successfully return a restaurant by id', async () => {
      const mockRawQuerySelectResponse = [
        {
          restaurantID: 1,
        },
      ];
      const expectedResponse = {
        restaurantID: 1,
      };
      (rawQuery as jest.MockedFunction<any>).mockResolvedValueOnce(mockRawQuerySelectResponse);
      const result = await restaurantsModel.getRestaurantByID(1);

      expect(rawQuery).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResponse);
    });
    it('should not return a restaurant because a database error occurred', async () => {
      (rawQuery as jest.MockedFunction<any>).mockImplementationOnce(() => {
        throw Error;
      });
      await expect(restaurantsModel.getRestaurantByID(1)).rejects.toThrow();
      expect(rawQuery).toHaveBeenCalledTimes(1);
    });
  });
  describe('getRestaurantEntityByID', () => {
    it('should get restaurant entity by id successfully', async () => {
      const RESTAURANT_ID = 123;
      const RESTAURANT = {
        restaurant_id: RESTAURANT_ID,
        name: 'test menu section',
        created_at: '2022-02-02T02:44:11.950Z',
        updated_at: '2022-02-02T02:44:11.950Z',
      };

      const findOne = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        findOne,
      });
      (findOne as jest.MockedFunction<any>).mockResolvedValueOnce(RESTAURANT as RestaurantEntity);

      const result = await restaurantsModel.getRestaurantEntityByID(RESTAURANT_ID);

      expect(findOne).toHaveBeenCalledTimes(1);
      expect(result).toEqual(RESTAURANT);
    });
  });
  describe('getRestaurantEntityWithModifiersByID', () => {
    it('should get restaurant entity by id successfully', async () => {
      const RESTAURANT_ID = 123;
      const RESTAURANT = {
        restaurant_id: RESTAURANT_ID,
        name: 'test menu section',
        created_at: '2022-02-02T02:44:11.950Z',
        updated_at: '2022-02-02T02:44:11.950Z',
      };

      const getRepository = jest.fn();
      const getOne = jest.fn();
      const where = jest.fn(() => ({ getOne }));
      const leftJoinAndSelect = jest.fn(() => ({ where }));
      const createQueryBuilder: any = jest.fn(() => ({
        leftJoinAndSelect,
      }));

      const REPOSITORY: any = {
        createQueryBuilder,
      };
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        getRepository: () => REPOSITORY,
      });
      getRepository.mockImplementation(() => createQueryBuilder);
      (getOne as jest.MockedFunction<any>).mockResolvedValueOnce(RESTAURANT as RestaurantEntity);

      const result = await restaurantsModel.getRestaurantEntityWithModifiersByID(RESTAURANT_ID);

      expect(getOne).toHaveBeenCalledTimes(1);
      expect(result).toEqual(RESTAURANT);
    });
  });
  describe('getRestaurantsEntityByManagerID', () => {
    const MANAGER_ID = 1000;
    it('should get restaurant entities by manager id successfully for non superuser', async () => {
      const MANAGER_ID = 1000;
      const getRepository = jest.fn();
      const getMany = jest.fn();
      const orderBy = jest.fn(() => ({ getMany }));
      const innerJoinAndSelect1 = jest.fn(() => ({ orderBy }));
      const where = jest.fn(() => ({ innerJoinAndSelect: innerJoinAndSelect1 }));
      const createQueryBuilder: any = jest.fn(() => ({
        where,
      }));

      const REPOSITORY: any = {
        createQueryBuilder,
      };

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        getRepository: () => REPOSITORY,
      });
      getRepository.mockImplementation(() => createQueryBuilder);
      (getMany as jest.MockedFunction<any>).mockResolvedValueOnce([RESTAURANT]);

      const result = await restaurantsModel.getRestaurantsEntityByManagerID(MANAGER_ID, false);

      expect(getMany).toHaveBeenCalledTimes(1);
      expect(result).toEqual([RESTAURANT]);
    });
    it('should get all restaurant entities for special_users (super user)', async () => {
      const getRepository = jest.fn();
      const getMany = jest.fn();
      const orderBy = jest.fn(() => ({ getMany }));
      const where = jest.fn(() => ({ orderBy }));
      const createQueryBuilder: any = jest.fn(() => ({
        where,
      }));

      const REPOSITORY: any = {
        createQueryBuilder,
      };

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        getRepository: () => REPOSITORY,
      });
      getRepository.mockImplementation(() => createQueryBuilder);
      (getMany as jest.MockedFunction<any>).mockResolvedValueOnce([RESTAURANT]);

      const result = await restaurantsModel.getRestaurantsEntityByManagerID(MANAGER_ID, true);

      expect(getMany).toHaveBeenCalledTimes(1);
      expect(result).toEqual([RESTAURANT]);
    });
    it('should throw HttpException 500 if any error occurs while getting restaurant entities by manager id for', async () => {
      const createQueryBuilder = jest.fn().mockImplementation(() => {
        throw new Error();
      });
      const REPOSITORY: any = {
        createQueryBuilder,
      };
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        getRepository: () => REPOSITORY,
      });

      try {
        await restaurantsModel.getRestaurantsEntityByManagerID(MANAGER_ID, false);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
  describe('getRestaurantByNameAndAddress', () => {
    const RESTAURANT_NAME = 'Test Restaurant';
    const ADDRESS_1 = '123 fake street';
    const CITY = 'New York City';
    const GOVERNING_DISTRICT = 'NY';
    const COUNTRY_ID = 1;
    const POSTAL_CODE = '11111';
    const mockRestaurantResponse = {
      restaurant_id: 1008,
      name: 'Test Restaurant',
      description: 'test description',
      phone: '1112223333',
      email: 'test@email.com',
      website: 'test website',
      is_published: false,
      updated_at: '2022-08-04T17:16:35.948Z',
      restaurant_url_id: '6e01f118',
    };
    it('should get restaurant by name and address with all values provided', async () => {
      const getRepository = jest.fn();
      const getOne = jest.fn();
      const andWhere3 = jest.fn();
      const andWhere2 = jest.fn(() => ({ andWhere: andWhere3, getOne }));
      const andWhere1 = jest.fn(() => ({ andWhere: andWhere2 }));
      const where = jest.fn(() => ({ andWhere: andWhere1 }));
      const leftJoinAndSelect = jest.fn(() => ({ where }));
      const createQueryBuilder: any = jest.fn(() => ({
        leftJoinAndSelect,
      }));

      const REPOSITORY: any = {
        createQueryBuilder,
      };

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        getRepository: () => REPOSITORY,
      });
      getRepository.mockImplementation(() => createQueryBuilder);
      (getOne as jest.MockedFunction<any>).mockResolvedValueOnce(mockRestaurantResponse);

      const result = await restaurantsModel.getRestaurantByNameAndAddress(
        RESTAURANT_NAME,
        ADDRESS_1,
        CITY,
        GOVERNING_DISTRICT,
        COUNTRY_ID,
        POSTAL_CODE,
      );

      expect(getOne).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockRestaurantResponse);
    });
    it('should get restaurant by name and address with only required values provided', async () => {
      const getRepository = jest.fn();
      const getOne = jest.fn();
      const andWhere3 = jest.fn();
      const andWhere2 = jest.fn(() => ({ andWhere: andWhere3, getOne }));
      const andWhere1 = jest.fn(() => ({ andWhere: andWhere2 }));
      const where = jest.fn(() => ({ andWhere: andWhere1 }));
      const leftJoinAndSelect = jest.fn(() => ({ where }));
      const createQueryBuilder: any = jest.fn(() => ({
        leftJoinAndSelect,
      }));

      const REPOSITORY: any = {
        createQueryBuilder,
      };

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        getRepository: () => REPOSITORY,
      });
      getRepository.mockImplementation(() => createQueryBuilder);
      (getOne as jest.MockedFunction<any>).mockResolvedValueOnce(mockRestaurantResponse);

      const result = await restaurantsModel.getRestaurantByNameAndAddress(RESTAURANT_NAME, ADDRESS_1, null, null, COUNTRY_ID, null);

      expect(getOne).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockRestaurantResponse);
    });
    it('should throw HttpException 500 if any error occurs while getting restaurant entity by name and address', async () => {
      const mockRestaurant = {};
      const getRepository = jest.fn();
      const getOne = jest.fn();
      const andWhere = jest.fn(() => ({ getOne: getOne }));
      const where = jest.fn(() => ({ andWhere: andWhere }));
      const leftJoinAndSelect1 = jest.fn(() => ({ where: where }));
      const createQueryBuilder: any = jest.fn(() => ({
        leftJoinAndSelect: leftJoinAndSelect1,
      }));

      const REPOSITORY: any = {
        createQueryBuilder,
      };

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        getRepository: () => REPOSITORY,
      });
      getRepository.mockImplementation(() => createQueryBuilder);
      (getOne as jest.MockedFunction<any>).mockResolvedValueOnce(mockRestaurant);

      try {
        await restaurantsModel.getRestaurantByNameAndAddress(RESTAURANT_NAME, ADDRESS_1, CITY, GOVERNING_DISTRICT, COUNTRY_ID, POSTAL_CODE);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }
    });
  });
  describe('insertRestaurantEntity', () => {
    it('should insert restaurant entity successfully', async () => {
      const expectedResponse = {
        restaurant_id: 1000,
        name: 'Test Restaurant',
        description: 'test description',
        created_at: '2022-08-04T22:33:14.603Z',
        cuisine_id: 1,
        phone: '1112223333',
        email: 'test@email.com',
        website: 'test website',
        updated_at: '2022-08-04T22:33:14.603Z',
        restaurant_url_id: '1f22a858',
      };

      const insert = jest.fn().mockResolvedValue({ raw: [expectedResponse] });
      const REPOSITORY: any = {
        insert,
      };

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        getCustomRepository: () => REPOSITORY,
      });

      const result = await restaurantsModel.insertRestaurantEntity(RESTAURANT_ENTITY as RestaurantEntity);

      expect(insert).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResponse);
    });
    it('should throw a HttpException if any error occurs while inserting restaurant', async () => {
      const insert = jest.fn().mockImplementation(() => {
        throw new Error();
      });
      const REPOSITORY: any = {
        insert,
      };

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        getCustomRepository: () => REPOSITORY,
      });

      try {
        await restaurantsModel.insertRestaurantEntity(RESTAURANT_ENTITY as RestaurantEntity);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(insert).toHaveBeenCalledTimes(1);
    });
  });
  describe('updateRestaurantEntity', () => {
    const RESTAURANT_ID = 1;
    it('should update restaurant entity successfully', async () => {
      const update = jest.fn();
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        update,
      });

      await restaurantsModel.updateRestaurantEntity(RESTAURANT_ENTITY as RestaurantEntity, RESTAURANT_ID);

      expect(update).toHaveBeenCalledTimes(1);
    });
    it('should throw a HttpException if any error occurs while updating restaurant', async () => {
      const update = jest.fn().mockImplementation(() => {
        throw new Error();
      });
      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        update,
      });

      try {
        await restaurantsModel.updateRestaurantEntity(RESTAURANT_ENTITY as RestaurantEntity, RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(update).toHaveBeenCalledTimes(1);
    });
  });
  describe('getRestaurantDetailsEntityByRestaurantID', () => {
    const RESTAURANT_ID = 1;

    it('should get restaurant entity by restaurantID successfully', async () => {
      const getOne = jest.fn().mockResolvedValueOnce(RESTAURANT_DETAILS);

      const queryBuilder: any = {
        where: jest.fn(),
        andWhere: jest.fn(),
        leftJoinAndSelect: jest.fn(),
        orderBy: jest.fn(),
        getOne,
      };

      // Every QueryBuilder method returns the same QueryBuilder,
      // allowing any number of chained joins.
      queryBuilder.where.mockReturnValue(queryBuilder);
      queryBuilder.andWhere.mockReturnValue(queryBuilder);
      queryBuilder.leftJoinAndSelect.mockReturnValue(queryBuilder);
      queryBuilder.orderBy.mockReturnValue(queryBuilder);

      const repository: any = {
        createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      };

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        getRepository: jest.fn().mockReturnValue(repository),
      });

      const result = await restaurantsModel.getRestaurantDetailsEntityByRestaurantID(RESTAURANT_ID);

      expect(repository.createQueryBuilder).toHaveBeenCalledWith('restaurants');

      expect(queryBuilder.where).toHaveBeenCalledWith('restaurants.deleted = :deleted', {
        deleted: false,
      });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith('restaurants.restaurant_id = :restaurantID', {
        restaurantID: RESTAURANT_ID,
      });

      // TAB-464 Brand relations
      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('restaurants.brand', 'brand');

      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('brand.cuisine', 'brandCuisine');

      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('brand.socials', 'brandSocials');

      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('restaurants.restaurant_address', 'address');

      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('address.country_id', 'country');

      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('restaurants.images', 'images', 'images.deleted IS NULL OR images.deleted = false');

      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('images.restaurant_image_type_id', 'imageType');

      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('restaurants.menus', 'menu', 'menu.deleted IS NULL OR menu.deleted = false');

      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'menu.sections',
        'menuSections',
        'menuSections.deleted IS NULL OR menuSections.deleted = false',
      );

      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('restaurants.restaurant_menu_layouts', 'restaurantMenuLayouts');

      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('restaurantMenuLayouts.menu_layout_id', 'menuLayout');

      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('restaurants.hours', 'hours');

      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('restaurants.profilePages', 'pages', 'pages.deleted_at IS NULL');

      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('restaurants.restaurant_profile_albums', 'albums', 'albums.deleted_at IS NULL');

      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('albums.restaurant_profile_album_media', 'gallery', 'gallery.deleted_at IS NULL');

      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('gallery.media', 'media');

      expect(queryBuilder.orderBy).toHaveBeenCalledWith({
        'restaurants.name': 'ASC',
        'menu.list_order': 'ASC',
        'menuSections.list_order': 'ASC',
        'albums.list_order': 'ASC',
        'gallery.list_order': 'ASC',
      });

      expect(getOne).toHaveBeenCalledTimes(1);
      expect(result).toEqual(RESTAURANT_DETAILS);
    });

    it('should throw a HttpException if any error occurs while getting restaurant details', async () => {
      const repository: any = {
        createQueryBuilder: jest.fn().mockImplementation(() => {
          throw new Error('database failure');
        }),
      };

      (ormConnection as jest.MockedFunction<any>).mockResolvedValueOnce({
        getRepository: jest.fn().mockReturnValue(repository),
      });

      try {
        await restaurantsModel.getRestaurantDetailsEntityByRestaurantID(RESTAURANT_ID);
      } catch (err) {
        expect(err.status).toEqual(500);
        expect(err.payload instanceof HttpException);
      }

      expect(repository.createQueryBuilder).toHaveBeenCalledTimes(1);
    });
  });
});
