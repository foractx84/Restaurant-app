import { EntityRepository, EntityManager, InsertResult, Raw } from 'typeorm';

/**
 * This repo has generic sql query functionality that can be used across all entities
 * For example: insert(table, values) can be used with menus, menu_sections, menu_hours, menu_items, etc.,
 * and any database tables that have entities set up in the entities directory
 */
@EntityRepository()
export class PostgresQueriesRepository {
  constructor(private manager: EntityManager) {}

  // inserts into any table values of type T (i.e. array of objects)
  insert = async <T>(table: string, values: T): Promise<InsertResult> => {
    return await this.manager.createQueryBuilder().insert().into(table).values(values).returning('*').execute();
  };

  /**
   * Finds rows in table via id and also via values in an array based on a column (i.e. column: [names] ---> name: ["name1, name2, name3"])
   * @param table - Database table being accessed
   * @param values - key pair being searched on, value of key expected to be an array. Example: { name: ["name1, name2, name3"] }
   * @param conditionals - additional conditionals to add to query. Example: { deleted: false, menuID: 123 }
   */
  fetchAllByValues = async <T>(table: string, values: object, conditionals: object): Promise<T> => {
    const [column, array_values] = Object.entries(values)[0];
    const resultArrayWithID = await this.manager.find(table, {
      where: { [column]: Raw(alias => `${alias} ilike any(:array_values)`, { array_values }), ...conditionals },
    });
    return resultArrayWithID as unknown as T;
  };
}
