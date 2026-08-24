import {
  TagsModelInterface,
  TagsServiceInterface,
  TagsInterface,
  CreateTagRequestInterface,
  CreateTagResponseInterface,
  TagsDBInterface,
} from '@interfaces/tags.interface';
import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { logger } from '@/utils/logger';
import { TagsEntity } from '@/entities/tags.entity';

class TagsService implements TagsServiceInterface {
  private tagsModel: TagsModelInterface;

  constructor(tagsModel: TagsModelInterface) {
    this.tagsModel = tagsModel;
  }

  createRestaurantTag = async (tag: CreateTagRequestInterface, restaurantID: number) => {
    try {
      const tagEntity = this.buildTagEntity(tag, restaurantID);
      const tagInsertResponse: TagsDBInterface = await this.tagsModel.insertTag(tagEntity);
      return this.buildCreateTagResponse(tagInsertResponse);
    } catch (err) {
      if (err instanceof HttpException) {
        // if error has already been typed and taken care of
        throw err;
      } else {
        logger.error(
          `Error occurred while creating tag with name: '${tag.name}' and color: '${
            tag.color ? tag.color : '#05944F'
          }' for restaurantID: ${restaurantID} - ` + err,
        );
        throw new HttpException(
          500,
          getErrorPayload(
            InternalErrorCode.runtimeError,
            `Error occurred while creating tag with name: '${tag.name}' and color: '${
              tag.color ? tag.color : '#05944F'
            }' for restaurantID: ${restaurantID}. Refer to the logs for more detail.`,
          ),
        );
      }
    }
  };

  getCustomTagsAndDefaultTagsByRestaurantID = async (restaurantID: number): Promise<TagsInterface[]> => {
    try {
      return this.buildGetAllTagsResponse(await this.tagsModel.getCustomTagsAndDefaultTagsByRestaurantID(restaurantID));
    } catch (err) {
      if (err instanceof HttpException) {
        // if error has already been typed and taken care of
        throw err;
      } else {
        logger.error(`Error occurred while getting tags - ` + err);
        throw new HttpException(
          500,
          getErrorPayload(InternalErrorCode.runtimeError, `Error occurred while getting tags. Refer to the logs for more detail.`),
        );
      }
    }
  };

  validateTagsByRestaurantID = async (tagIDs: number[], restaurantID: number): Promise<void> => {
    try {
      if (tagIDs?.length > 0) {
        const tags = await this.tagsModel.getCustomTagsAndDefaultTagsByRestaurantID(restaurantID);
        tagIDs.forEach(id => {
          if (!tags.find(tag => tag.tag_id === id)) {
            throw new HttpException(
              400,
              getErrorPayload(InternalErrorCode.missingInputOrIncorrectType, `Provided tag with id ${id} does not exist.`),
            );
          }
        });
      }
    } catch (err) {
      if (err instanceof HttpException) {
        // if error has already been typed and taken care of
        throw err;
      } else {
        logger.error(`Error occurred while validating tag - ` + err);
        throw new HttpException(
          500,
          getErrorPayload(InternalErrorCode.runtimeError, `Error occurred while validating tag. Refer to the logs for more detail.`),
        );
      }
    }
  };

  buildGetAllTagsResponse = (tags: TagsDBInterface[]): TagsInterface[] => {
    return tags.map(entity => {
      return {
        tagID: entity.tag_id,
        name: entity.name,
        tagColor: entity.color,
      };
    });
  };

  buildTagEntity = (tag: CreateTagRequestInterface, restaurantID: number): TagsEntity => {
    const tagEntity = new TagsEntity();
    tagEntity.name = tag.name;
    tagEntity.color = tag.color ? tag.color : '#05944F';
    tagEntity.restaurant_id = restaurantID;

    return tagEntity;
  };

  buildCreateTagResponse = (tag: TagsDBInterface): CreateTagResponseInterface => {
    return {
      tagID: tag.tag_id,
      name: tag.name,
      color: tag.color,
    } as CreateTagResponseInterface;
  };
}

export default TagsService;
