import { EntityManager, IsNull } from 'typeorm';
import { ormConnection } from '@utils/dbUtils';
import { TagsDBInterface, TagsModelInterface } from '@interfaces/tags.interface';
import { TagsEntity } from '@entities/tags.entity';
import { logger } from '@utils/logger';
import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { PostgresQueriesRepository } from '@entities/repositories/postgres.repository';
import { classToPlain } from 'class-transformer';

class TagsModel implements TagsModelInterface {
  insertTag = async (tagEntity: TagsEntity, repository?: EntityManager): Promise<TagsDBInterface> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      const customRepository = await repository.getCustomRepository(PostgresQueriesRepository);

      const tagResult = await customRepository.insert('tags', [tagEntity]);
      const databaseResult: TagsDBInterface = classToPlain(tagResult.raw[0]) as TagsDBInterface;

      return databaseResult;
    } catch (err) {
      logger.error(
        `Error occurred while creating tag with name: '${tagEntity.name}' and color: '${tagEntity.color}' for restaurantID: ${tagEntity.restaurant_id} - ` +
          err,
      );

      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while creating tag with name: '${tagEntity.name}' and color: '${tagEntity.color}' for restaurantID: ${tagEntity.restaurant_id}`,
        ),
      );
    }
  };

  getTagByNameAndColorAndRestaurantID = async (
    restaurantID: number,
    tagName: string,
    color: string,
    repository?: EntityManager,
  ): Promise<TagsDBInterface> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      return await repository.findOne(TagsEntity, {
        where: { name: tagName, color: color, restaurant_id: restaurantID },
      });
    } catch (err) {
      logger.error(`Error with selecting tag with name: '${tagName}', color: '${color}' and restaurant id: ${restaurantID} - ` + err);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error selecting tag with name: '${tagName}', color: '${color}' and restaurant id: ${restaurantID}`,
        ),
      );
    }
  };

  getCustomTagsAndDefaultTagsByRestaurantID = async (restaurantID: number, repository?: EntityManager): Promise<TagsDBInterface[]> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      return await repository.find(TagsEntity, {
        where: [{ restaurant_id: restaurantID }, { restaurant_id: IsNull() }],
        order: { name: 'ASC' },
      });
    } catch (err) {
      logger.error(`Error occurred while getting tags by restaurant id: ${restaurantID} - ` + err);

      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while getting tags by restaurant id: ${restaurantID}. Refer to the logs for more detail.`,
        ),
      );
    }
  };
}

export default TagsModel;
