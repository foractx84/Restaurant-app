import { PgBoss as PgBossType } from 'pg-boss';

import { databaseConfig } from '@/configs/config';
let boss: PgBossType;

export async function startBoss(): Promise<PgBossType> {
  const { PgBoss } = require('pg-boss');
  boss = new PgBoss({
    host: databaseConfig.HOST,
    port: databaseConfig.PORT,
    user: databaseConfig.USER,
    password: databaseConfig.PASSWORD,
    database: databaseConfig.DB,
  });

  boss.on('error', console.error);
  await boss.start();
  return boss;
}

export function getBoss(): PgBossType {
  if (!boss) throw new Error('pg-boss not initialized');
  return boss;
}
