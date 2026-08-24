import { Request, Response, NextFunction } from 'express';
import { HttpException } from '@/exceptions/HttpException';
import MediaLibraryModel from '@/models/mediaLibrary.model';
import { handleLinkingLongFormVideo } from '@/middlewares/handleLinkingLongFormVideo.middleware';
import { MediaEntity } from '@/entities/media.entity';
import { checkFileExists } from '@/utils/GCP_bucket';
import { createTranscodingJob } from '@/utils/transcodeUtils';

jest.mock('@/utils/logger', () => {
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  return { __esModule: true, logger: logger };
});
jest.mock('@/models/mediaLibrary.model', () => {
  const mockMediaLibraryModel = {
    getMediaByMediaURL: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mockMediaLibraryModel) };
});
jest.mock('@/utils/GCP_bucket', () => require('../../../../__mocks__/GCP_bucket'));
jest.mock('@/utils/transcodeUtils', () => require('../../../../__mocks__/transcodeUtils'));
jest.mock('@/configs/config', () => {
  const MOCKED_APP_CONFIG = {
    IMAGE_BUCKET: 'dummy',
    VIDEO_LOCAL_PATH: 'videos/original/dummyPath',
  };

  return {
    __esModule: true,
    APP_CONFIG: MOCKED_APP_CONFIG,
    default: MOCKED_APP_CONFIG,
  };
});

const mediaLibraryModel = new MediaLibraryModel();

describe('handleLinkingLongFormVideo', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  const VIDEO_UUID = 'some_uuid.mp4';
  const MEDIA_URL = 'www.some_uuid.com';
  const MEDIA: Partial<MediaEntity> = {
    media_url: MEDIA_URL,
  };
  it('should successfully link long form video', async () => {
    const mReq: Partial<Request> = {
      body: {
        videoUUID: VIDEO_UUID,
      },
      headers: {
        authorization: 'token',
        restaurantID: '1',
      },
    };
    const mRes: Partial<Response> = {
      json: jest.fn(),
      locals: { restaurantID: 1 },
    };

    (mediaLibraryModel.getMediaByMediaURL as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);
    (checkFileExists as jest.MockedFunction<any>).mockResolvedValueOnce(true);
    (createTranscodingJob as jest.MockedFunction<any>).mockResolvedValueOnce(true);

    const mNext = jest.fn();

    await handleLinkingLongFormVideo(mReq as Request, mRes as Response, mNext as NextFunction);

    expect(mNext).toHaveBeenCalled();
    expect(mediaLibraryModel.getMediaByMediaURL).toHaveBeenCalledTimes(1);
    expect(checkFileExists).toHaveBeenCalledTimes(1);
    expect(createTranscodingJob).toHaveBeenCalledTimes(1);
  });
  it('should throw 409 Resource Conflict HTTP exception if video already exists by uuid', async () => {
    const mReq: Partial<Request> = {
      body: {
        videoUUID: VIDEO_UUID,
      },
      headers: {
        authorization: 'token',
        restaurantID: '1',
      },
    };
    const mRes: Partial<Response> = {
      json: jest.fn(),
      locals: { restaurantID: 1 },
    };
    const mNext = jest.fn();

    (mediaLibraryModel.getMediaByMediaURL as jest.MockedFunction<any>).mockResolvedValueOnce(MEDIA);

    try {
      await handleLinkingLongFormVideo(mReq as Request, mRes as Response, mNext as NextFunction);
    } catch (err) {
      expect(err.status).toEqual(409);
      expect(err.payload instanceof HttpException);
    }

    expect(mNext).toHaveBeenCalled();
  });
  it('should throw 404 HTTP exception if video uuid does not exist up on the cloud storage bucket', async () => {
    const mReq: Partial<Request> = {
      body: {
        videoUUID: VIDEO_UUID,
      },
      headers: {
        authorization: 'token',
        restaurantID: '1',
      },
    };
    const mRes: Partial<Response> = {
      json: jest.fn(),
      locals: { restaurantID: 1 },
    };
    const mNext = jest.fn();

    (mediaLibraryModel.getMediaByMediaURL as jest.MockedFunction<any>).mockResolvedValueOnce(undefined);

    (checkFileExists as jest.MockedFunction<any>).mockResolvedValueOnce(false);

    try {
      await handleLinkingLongFormVideo(mReq as Request, mRes as Response, mNext as NextFunction);
    } catch (err) {
      expect(err.status).toEqual(404);
      expect(err.payload instanceof HttpException);
    }

    expect(mNext).toHaveBeenCalled();
  });
});
