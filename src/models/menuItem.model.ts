import {
  GetMenuItemsByMenuSectionDBInterface,
  MenuItemDBInterface,
  MenuItemModelInterface,
  ReorderMenuItemsQueryInterface,
} from '@interfaces/menuItem.interface';
import { EntityManager } from 'typeorm';
import { ormConnection, rawQuery } from '@utils/dbUtils';
import { logger } from '@utils/logger';
import { getErrorPayload, HttpException, InternalErrorCode } from '@exceptions/HttpException';
import { MenuItemEntity } from '@entities/menuItem.entity';
import { PostgresQueriesRepository } from '@entities/repositories/postgres.repository';
import { classToPlain } from 'class-transformer';

class MenuItemModel implements MenuItemModelInterface {
  getMenuItemsByMenuSection = async (menuSectionID: number, includeHidden = false): Promise<GetMenuItemsByMenuSectionDBInterface> => {
    try {
      const getMenuItemsByMenuSectionQuery = `
    select
      jsonb_agg(
        jsonb_build_object(
          'menuItemID', mi.menu_item_id,
          'name', mi.name,
          'description', mi.description,
          'calories', mi.calories,
          'category', mi.category,
          'baseItemSizeID',mi.base_item_size_id,
          'listOrder', mi.list_order,
          'createdAt', mi.created_at,
          'updatedAt', mi.updated_at,
          'imageUrl', mi.image_url,
          'isHidden', mi.is_hidden,
          'isFeatured', mi.is_featured,
          'externalID', mi.external_id,
          'media', (
            select jsonb_agg(
              jsonb_build_object(
                'mediaURL', mim.media_url,
                'mediaID', mim.media_id,
                'listOrder', mim.list_order,
                'type', mimt.type,
                'thumbnail', (
                    select jsonb_build_object(
                                            'thumbnailID', mivt.media_id,
                                            'thumbnailURL', mivt.thumbnail_url
                    )
                    from menu_item_video_thumbnails mivt
                    join media_library mlt on mlt.media_id = mivt.media_id
                    where mivt.menu_item_media_id in (select menu_item_media_id
                                                      from menu_item_media
                                                      where menu_item_media.menu_item_id = mi.menu_item_id
                    ) and mivt.deleted_at is null and mlt.deleted_at is null
                )
              )
            )
            from menu_item_media mim
            join menu_item_media_types mimt on mim.menu_item_media_type_id = mimt.menu_item_media_type_id
            join media_library ml on mim.media_id = ml.media_id
            where mi.menu_item_id = mim.menu_item_id and mim.deleted_at is null and ml.deleted_at is null
            group by mim.menu_item_id
          ),
          'modifierGroups', (
            select jsonb_agg(
              jsonb_build_object(
                'modifierGroupID', mg."modifier_group_id",
                'name', mg."name",
                'label', mg."label",
                'listOrder', mgtmil."list_order",
                'externalID', mg."external_id",
                'modifiers', (
                  select jsonb_agg(
                    jsonb_build_object(
                      'modifierID', m."modifier_id",
                      'name', m."name",
                      'price', m."price",
                      'description', m."description",
                      'restaurantID', m."restaurant_id",
                      'createdAt', m."created_at",
                      'updatedAt', m."updated_at",
                      'listOrder', mtmgl."list_order",
                      'externalID', m."external_id",
                      'isHidden', m."is_hidden",
                      'media', (
                              select jsonb_agg(
                                jsonb_build_object(
                                  'mediaURL', ml."media_url",
                                  'type', mt."type"
                                )
                              )
                          FROM modifier_media mm
                          JOIN media_library ml ON mm.media_id = ml.media_id
                          JOIN media_types mt ON mt.media_type_id = ml.media_type_id
                          WHERE ml.deleted_at IS NULL AND mm.modifier_id = m.modifier_id AND m.deleted_at IS NULL AND m.is_hidden = false
                      )
                    )
                  )
                  FROM modifiers m
                  JOIN modifier_to_modifier_group_link mtmgl ON mtmgl.modifier_id = m.modifier_id
                  WHERE mtmgl.modifier_group_id = mg.modifier_group_id AND m.deleted_at IS NULL AND (m.is_hidden = false OR :includeHidden = true)
                )
              )
            )
            FROM modifier_groups mg
            JOIN modifier_group_to_menu_item_link mgtmil ON mg.modifier_group_id = mgtmil.modifier_group_id
            WHERE mgtmil.menu_item_id = mi.menu_item_id AND mg.deleted_at is NULL AND (mg.is_hidden = false OR :includeHidden = true)
          ),
          'pairings', (
            select jsonb_agg(
              jsonb_build_object(
                'drinkItemID', rd.menu_item_id,
                'name', rd."name",
                'isHidden', rd.is_hidden
              )
            )
            from menu_item_pairings mird
            join menu_items rd on mird.paired_item_id = rd.menu_item_id
            where mird.menu_item_id = mi.menu_item_id and rd.deleted = false
            group by mird.menu_item_id
          ),
          'allItemSizes', (
            select jsonb_agg(
              jsonb_build_object(
                'id', mist.id,
                'label', mist.label,
                'price', mist.price,
                'priceOverride', mist.price_override
              )
            )
            from menu_items_sizes mis
            join menu_items_size_types mist on mis.item_size_id = mist.id
            where mis.menu_item_id = mi.menu_item_id
            group by mis.menu_item_id
          ),
          'dietaryRestrictions', (
            select jsonb_agg(
              jsonb_build_object(
                'restrictionID', dr.restriction_id,
                'name', dr."name",
                'updatedAt', dr.updated_at,
                'createdAt', dr.created_at
              )
            )
            from menu_items_restrictions mir
            join restrictions dr on mir.restriction_id = dr.restriction_id
            where mi.menu_item_id = mir.menu_item_id
            group by mir.menu_item_id
          ),
          'tags', (
            select jsonb_agg(
              jsonb_build_object(
                'tagID', mit.tag_id,
                'tagColor', t.color,
                'name', t."name"
              )
            )
            from menu_items_tags mit
            join tags t on mit.tag_id = t.tag_id
            where mi.menu_item_id = mit.menu_item_id
            group by mit.menu_item_id
          )
        )
      ) as "menuItems"
    from menu_items mi
    where mi.menu_section_id = :menuSectionID and deleted = false
    group by mi.menu_section_id;
    `;

      // `includeHidden` lets the Otter push flow (a full-replacement upsert keyed by id) see hidden
      // modifiers/groups too -- omitting an existing entity from that flow tells Otter to DELETE it,
      // not mark it unavailable. Other callers (the manager-facing menu-details view) keep the
      // default `false`, matching existing behavior.
      return await rawQuery(getMenuItemsByMenuSectionQuery, { menuSectionID, includeHidden });
    } catch (err) {
      logger.warn(`Error in getMenuItemsByMenuSection with getting menuSectionID: ${menuSectionID} - ` + err);
      throw new HttpException(
        500,
        getErrorPayload(InternalErrorCode.databaseError, `Error in getMenuItemsByMenuSection with getting menuSectionID: ${menuSectionID}`),
      );
    }
  };

  getMenuItemByExternalID = async (externalID: string, manager?: EntityManager): Promise<MenuItemEntity> => {
    try {
      if (!manager) {
        manager = await ormConnection();
      }

      return await manager
        .createQueryBuilder<MenuItemEntity>(MenuItemEntity, 'menuItem')
        .leftJoinAndSelect('menuItem.media', 'media')
        .leftJoinAndSelect('menuItem.menu_item_sizes', 'menu_item_sizes')
        .leftJoinAndSelect('menu_item_sizes.item_sizes', 'item_sizes')
        .leftJoinAndSelect('menuItem.modifierGroupToMenuItemLinks', 'modifierGroupLinks')
        .leftJoinAndSelect('modifierGroupLinks.modifierGroup', 'modifierGroup')
        .where('menuItem.external_id = :externalID', { externalID })
        .andWhere('menuItem.deleted = false')
        .getOne();
    } catch (err) {
      logger.error(`Error occurred while fetching menu item by external id: ${externalID}. - ${err}`);
      throw new HttpException(
        500,
        getErrorPayload(
          InternalErrorCode.databaseError,
          `Error occurred while fetching menu item by external id: ${externalID}. Refer to logs for more info.`,
        ),
      );
    }
  };

  deleteMenuItemByID = async (menuItemID: number, manager?: EntityManager): Promise<void> => {
    try {
      if (!manager) {
        manager = await ormConnection();
      }

      await manager.delete(MenuItemEntity, menuItemID);
    } catch (err) {
      logger.warn(`Error deleting menu item with ID: ${menuItemID}` + err);
      throw new HttpException(500, getErrorPayload(InternalErrorCode.databaseError, `Error deleting menu item '${menuItemID}'`));
    }
  };

  findMenuItemByIDAndRestaurantID = async (menuItemID: number, restaurantID: number): Promise<MenuItemEntity> => {
    const ormConn: EntityManager = await ormConnection();
    return await ormConn
      .getRepository<MenuItemEntity>(MenuItemEntity)
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.menu_section_id', 'section')
      .leftJoinAndSelect('section.menu_id', 'menu')
      .leftJoinAndSelect('menu.restaurant_id', 'restaurant')
      .where('restaurant.restaurant_id = :restaurantID', { restaurantID })
      .andWhere('item.menu_item_id = :menuItemID', { menuItemID })
      .andWhere('item.deleted = false')
      .getOne();
  };

  getLargestListOrderInMenuSection = async (menuSectionID: number, repository?: EntityManager): Promise<number> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      const result = await repository
        .getRepository(MenuItemEntity)
        .createQueryBuilder('item')
        .select('MAX(item.list_order)', 'maxListOrderValue')
        .where('item.menu_section_id = :menuSectionID', { menuSectionID })
        .andWhere('item.deleted = false')
        .getRawOne();

      return result.maxListOrderValue;
    } catch (err) {
      logger.warn(`Error getting largest list order entity with menu section id: '${menuSectionID}' -` + err);
      throw new HttpException(
        500,
        getErrorPayload(InternalErrorCode.databaseError, `Error getting largest list order entity with menu section id: '${menuSectionID}'`),
      );
    }
  };

  getMenuItemEntityByID = async (menuItemID: number, manager?: EntityManager): Promise<MenuItemEntity> => {
    try {
      const ormConn: EntityManager = manager ?? (await ormConnection());
      return await ormConn.findOne<MenuItemEntity>(MenuItemEntity, menuItemID, { relations: ['menu_section_id'], where: [{ deleted: false }] });
    } catch (err) {
      logger.warn(`Error getting menu item with id: '${menuItemID}' -` + err);
      throw new HttpException(500, getErrorPayload(InternalErrorCode.databaseError, `Error fetching menu item with id'${menuItemID}`));
    }
  };

  getMenuItemEntityWithMediaByID = async (menuItemID: number): Promise<MenuItemEntity> => {
    try {
      const ormConn: EntityManager = await ormConnection();
      return await ormConn
        .getRepository<MenuItemEntity>(MenuItemEntity)
        .createQueryBuilder('menuItem')
        .leftJoinAndSelect('menuItem.media', 'menuItemMedia')
        .leftJoinAndSelect('menuItemMedia.menu_item_video_thumbnail', 'thumbnail')
        .leftJoinAndSelect('menuItemMedia.media', 'media')
        .leftJoinAndSelect('media.media_type', 'mediaType')
        .where('menuItem.menu_item_id = :menuItemID', { menuItemID })
        .andWhere('menuItem.deleted = false')
        .andWhere('menuItemMedia.deleted_at is NULL')
        .andWhere('media.deleted_at is NULL')
        .getOne();
    } catch (err) {
      logger.warn(`Error getting menu item with id: '${menuItemID}' -` + err);
      throw new HttpException(500, getErrorPayload(InternalErrorCode.databaseError, `Error fetching menu item with id'${menuItemID}`));
    }
  };

  getMenuItemsEntitiesByMenuSectionID = async (menuSectionID: number, manager?: EntityManager): Promise<MenuItemEntity[]> => {
    try {
      if (!manager) {
        manager = await ormConnection();
      }
      return await manager.find<MenuItemEntity>(MenuItemEntity, { menu_section_id: menuSectionID, deleted: false });
    } catch (err) {
      logger.warn(`Error getting menu items with menu section id: '${menuSectionID}' -` + err);
      throw new HttpException(
        500,
        getErrorPayload(InternalErrorCode.databaseError, `Error fetching menu items with menu section id'${menuSectionID}`),
      );
    }
  };

  getMenuItemsOfMenuSectionByMenuItemID = async (menuItemID: number, repository?: EntityManager): Promise<MenuItemEntity[]> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      return await repository
        .getRepository<MenuItemEntity>(MenuItemEntity)
        .createQueryBuilder('item')
        .leftJoinAndSelect('item.menu_section_id', 'section')
        .where('item.deleted = false')
        .andWhere(qb => {
          const subQuery = qb
            .subQuery()
            .select('menuItem.menu_section_id')
            .from(MenuItemEntity, 'menuItem')
            .where('menuItem.menu_item_id = :menuItemID', { menuItemID })
            .getQuery();
          return 'item.menu_section_id =' + subQuery;
        })
        .orderBy({
          'item.list_order': 'ASC',
        })
        .getMany();
    } catch (err) {
      logger.warn(`Error getting menu items of menu section with menu item id: '${menuItemID}' -` + err);
      throw new HttpException(
        500,
        getErrorPayload(InternalErrorCode.databaseError, `Error fetching menu items of menu section with menu item id '${menuItemID}`),
      );
    }
  };

  hideMenuItem = async (menuItemID: number, hide: boolean, respository?: EntityManager): Promise<void> => {
    try {
      if (!respository) {
        respository = await ormConnection();
      }
      await respository.update(MenuItemEntity, menuItemID, { is_hidden: hide });
    } catch (err) {
      logger.warn(`Error updating menu item '${menuItemID} hide status -` + err);
      throw new HttpException(500, getErrorPayload(InternalErrorCode.databaseError, `Error updating menu item '${menuItemID} hide status`));
    }
  };

  insertMenuItem = async (menuItem: MenuItemEntity, manager?: EntityManager): Promise<MenuItemDBInterface> => {
    try {
      if (!manager) {
        manager = await ormConnection();
      }
      const customRepository = manager.getCustomRepository(PostgresQueriesRepository);
      const menuItemResult = await customRepository.insert('menu_items', [menuItem]);
      const databaseResult = classToPlain(menuItemResult.raw[0]);
      return databaseResult as MenuItemDBInterface;
    } catch (err) {
      logger.error(`Error occurred while creating menu item:  ${menuItem.name} - ` + err);
      throw new HttpException(
        500,
        getErrorPayload(InternalErrorCode.databaseError, 'Error occurred while creating menu item. Refer to logs for more info.'),
      );
    }
  };

  softDeleteMenuItemByID = async (menuItemID: number, manager?: EntityManager): Promise<void> => {
    try {
      if (!manager) {
        manager = await ormConnection();
      }
      await manager.update(MenuItemEntity, menuItemID, { deleted: true });
    } catch (err) {
      logger.error(`Error deleting menu item with ID: ${menuItemID}. - ${err}`);
      throw new HttpException(
        500,
        getErrorPayload(InternalErrorCode.databaseError, `Error deleting menu item '${menuItemID}. Refer to logs for more info.'`),
      );
    }
  };

  updateMenuItem = async (menuItem: MenuItemEntity, repository?: EntityManager): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      await repository.save(MenuItemEntity, menuItem);
    } catch (err) {
      logger.error(`Error updating menu item with id: '${menuItem.menu_item_id}' - ${err}`);
      throw new HttpException(
        500,
        getErrorPayload(InternalErrorCode.databaseError, `Error updating menu item with id'${menuItem.menu_item_id}. Refer to logs for more info.`),
      );
    }
  };

  patchMenuItem = async (menuItemID: number, fields: Partial<MenuItemEntity>, repository?: EntityManager): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      if (Object.keys(fields).length === 0) {
        return;
      }
      await repository.update(MenuItemEntity, menuItemID, fields);
    } catch (err) {
      logger.error(`Error patching menu item with id: '${menuItemID}' - ${err}`);
      throw new HttpException(
        500,
        getErrorPayload(InternalErrorCode.databaseError, `Error patching menu item with id'${menuItemID}. Refer to logs for more info.`),
      );
    }
  };

  updateMenuItemsListOrder = async (items: ReorderMenuItemsQueryInterface[], repository?: EntityManager): Promise<void> => {
    try {
      if (!repository) {
        repository = await ormConnection();
      }
      await repository.save(MenuItemEntity, items);
    } catch (err) {
      logger.error(`Error with updating menu items list order '${JSON.stringify(items)}`);
      throw new HttpException(
        500,
        getErrorPayload(InternalErrorCode.databaseError, `Error with updating menu items list order '${JSON.stringify(items)}`),
      );
    }
  };
}

export default MenuItemModel;
