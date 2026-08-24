import { databaseConfig } from '@/configs/config';
import path from 'path';
import { ConnectionOptions } from 'typeorm';
import { Pool } from 'pg';

type DatabaseParams = {
  host: string;
  port: number;
  username: string;
  password: string;
};

export const dbConnection: ConnectionOptions & DatabaseParams = {
  type: 'postgres',
  host: databaseConfig.HOST,
  port: databaseConfig.PORT,
  username: databaseConfig.USER,
  password: databaseConfig.PASSWORD,
  database: databaseConfig.DB,
  synchronize: false,
  logging: false,
  entities: [path.join(__dirname, '../**/*.entity{.ts,.js}')],
  migrations: [path.join(__dirname, '../**/*.migration{.ts,.js}')],
  subscribers: [path.join(__dirname, '../**/*.subscriber{.ts,.js}')],
  cli: {
    entitiesDir: 'src/entity',
    migrationsDir: 'src/migration',
    subscribersDir: 'src/subscriber',
  },
};

export const pool = new Pool({
  host: databaseConfig.HOST,
  port: databaseConfig.PORT,
  user: databaseConfig.USER,
  password: databaseConfig.PASSWORD,
  database: databaseConfig.DB,
});
