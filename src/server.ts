process.env['NODE_CONFIG_DIR'] = __dirname + '/configs';

import 'dotenv/config';

import App from '@/app';
import { checkmateIntegrationService, otterIntegrationService, routes } from '@/routes';
import validateEnv from '@utils/validateEnv';
import { startBoss } from '@queue';
import { QUEUES } from '@constants/queues.constants';
import { CheckmateIntegrationServiceInterface } from '@interfaces/checkmateIntegration.interface';
import { OtterIntegrationServiceInterface } from '@interfaces/otterIntegration.interface';

validateEnv();

export const app = new App(routes);

app
  .connectToDatabase()
  .then(async () => {
    try {
      const boss = await startBoss();

      await boss.createQueue(QUEUES.CHECKMATE_MENU_SYNC, { retryLimit: 3, retryBackoff: true });

      const checkmateService: CheckmateIntegrationServiceInterface = checkmateIntegrationService;
      await boss.work(QUEUES.CHECKMATE_MENU_SYNC, { localConcurrency: 5 }, checkmateService.processCheckmateJob);

      await boss.createQueue(QUEUES.OTTER_MENU_SYNC, { retryLimit: 3, retryBackoff: true });

      const otterService: OtterIntegrationServiceInterface = otterIntegrationService;
      await boss.work(QUEUES.OTTER_MENU_SYNC, { localConcurrency: 5 }, otterService.processOtterMenuSyncJob);

      // Scheduled fallback: hourly, catches menu changes missed by a dropped/delayed webhook.
      await boss.createQueue(QUEUES.OTTER_MENU_SYNC_SCAN, { retryLimit: 3, retryBackoff: true });
      await boss.schedule(QUEUES.OTTER_MENU_SYNC_SCAN, '0 * * * *', null, { tz: 'UTC' });
      await boss.work(QUEUES.OTTER_MENU_SYNC_SCAN, { localConcurrency: 1 }, otterService.processOtterMenuSyncScan);
    } catch (error) {
      console.error('Failed to connect to the pg-boss queue:', error);
      // Handle the error appropriately, maybe exit the process
      process.exit(1);
    }

    app.listen();
  })
  .catch(error => {
    console.error('Failed to connect to the database:', error);
    // Handle the error appropriately, maybe exit the process
    process.exit(1);
  });
