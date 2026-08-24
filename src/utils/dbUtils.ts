import { EntityManager, getConnection } from 'typeorm';

/**
 * Used for executing raw SQL queries with the option of injecting parameters
 * @param query raw SQL query statement you want to execute
 * @param parameters data you want to pass to the SQL query
 * @param manager an typeORM object that has a reference to the database connection
 * @returns an object of any type
 */
export async function rawQuery<T = any[]>(query: string, parameters: object = {}, manager?: EntityManager): Promise<T> {
  const conn = manager ? manager.connection : getConnection();
  const [escapedQuery, escapedParams] = conn.driver.escapeQueryWithParameters(query, parameters, {});
  return conn.query(escapedQuery, escapedParams);
}

/**
 * Used for executing typeorm method queries, createQueryBuilder, etc.
 * @param manager an typeORM object that has a reference to the database connection
 * @returns an object of type EntityManager
 */
export async function ormConnection(manager?: EntityManager): Promise<EntityManager> {
  const conn = manager ? manager.connection : getConnection();
  return conn.manager;
}
