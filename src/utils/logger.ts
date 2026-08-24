import { APP_CONFIG } from '@configs/config';
import fs from 'fs';
import winston from 'winston';
import winstonDaily from 'winston-daily-rotate-file';
import { LoggingWinston } from '@google-cloud/logging-winston';

// logs dir
const logDir = __dirname + '/../logs';

let logger: winston.Logger;

function initializeLogger() {
  const server = APP_CONFIG.SERVER;
  const version: string = process.env.npm_package_version;
  const serviceName = `superbackend-${APP_CONFIG.NODE_ENV}`;

  const cloudLoggingWinston = new LoggingWinston({
    logName: `superbackend-${APP_CONFIG.NODE_ENV}`,
    serviceContext: {
      service: serviceName,
      version: version,
    },
  });

  switch (server) {
    // Log to Cloud Logging only.
    // Cloud logs can be filtered with this query: `logName="projects/taptab-cloud-infrastructure/logs/mobilebackend-<ENV>"`
    case 'google-cloud':
      logger = winston.createLogger({
        format: winston.format.uncolorize(),
        transports: [cloudLoggingWinston],
      });
      break;
    // Old config for linode
    case 'linode':
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir);
      }
      logger = winston.createLogger({
        format: winston.format.combine(
          winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss',
          }),
          winston.format.printf(({ timestamp, level, message }) => `${timestamp} ${level}: ${message}`),
          winston.format.uncolorize(),
        ),
        transports: [
          // debug log setting
          new winstonDaily({
            level: 'debug',
            datePattern: 'YYYY-MM-DD',
            dirname: logDir + '/debug', // log file /logs/debug/*.log in save
            filename: `%DATE%.log`,
            maxFiles: 30, // 30 Days saved
            json: false,
            zippedArchive: true,
          }),
          // error log setting
          new winstonDaily({
            level: 'error',
            datePattern: 'YYYY-MM-DD',
            dirname: logDir + '/error', // log file /logs/error/*.log in save
            filename: `%DATE%.log`,
            maxFiles: 30, // 30 Days saved
            handleExceptions: true,
            json: false,
            zippedArchive: true,
          }),
        ],
      });
      break;
    // Log to console only if testing in localhost
    case 'localhost':
      logger = winston.createLogger({
        level: 'debug',
        format: winston.format.combine(
          winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss',
          }),
          winston.format.printf(({ timestamp, level, message }) => `${timestamp} ${level}: ${message}`),
        ),
        transports: [
          new winston.transports.Console({
            format: winston.format.combine(winston.format.splat(), winston.format.colorize()),
          }),
        ],
      });
      break;
  }
}

const stream = {
  write: (message: string) => {
    logger.info(message.substring(0, message.lastIndexOf('\n')));
  },
};

export { initializeLogger, logger, stream };
