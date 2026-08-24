process.env.NODE_CONFIG_DIR = __dirname + '/configs';

import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import hpp from 'hpp';
import morgan from 'morgan';
import 'reflect-metadata';

import { APP_CONFIG } from '@configs/config';
import authorizationMiddleware from '@middlewares/authorization.middleware';
import { createConnection } from 'typeorm';
import { dbConnection } from '@databases';
import errorMiddleware from '@middlewares/error.middleware';
import Route from '@interfaces/routes.interface';
import { initializeLogger, stream } from '@utils/logger';

class App {
  private readonly app: express.Application;
  private readonly port: string | number;
  private readonly env: string;

  constructor(routes: Route[]) {
    this.app = express();
    this.port = APP_CONFIG.API_PORT || 3000;
    this.env = APP_CONFIG.NODE_ENV || 'development';

    this.initialize(routes);
  }

  private initialize(routes: Route[]) {
    this.setupLogger();
    this.setupMiddlewares();
    this.setupRoutes(routes);
    this.setupSwagger();
    this.setupErrorHandling();
  }

  private setupLogger() {
    initializeLogger();
  }

  private setupMiddlewares() {
    this.app.use(morgan(this.env === 'production' ? 'combined' : 'dev', { stream }));
    this.app.use(
      cors({
        origin: this.env === 'production' ? [APP_CONFIG.CORS_ORIGIN] : true,
        credentials: true,
      }),
    );
    this.app.use(hpp());
    this.app.use(helmet());
    this.app.use(compression());

    // Handle JSON parsing conditionally for webhook routes that require raw bodies
    this.app.use((req, res, next) => {
      if (req.originalUrl === '/stripe/webhook' || req.originalUrl === '/otter/webhook') {
        next(); // Do nothing with the body because you need it in a raw state.
      } else {
        express.json()(req, res, next); // ONLY do express.json() if the received request is NOT a WebHook from Stripe.
      }
    });

    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(cookieParser());
  }

  private setupRoutes(routes: Route[]) {
    // Register protected routes
    const protectedRoutes = [
      '/announcement',
      '/announcements',
      '/careerRequests',
      '/careersSettings',
      '/cateringRequests',
      '/cateringSettings',
      '/discoveryContent',
      '/drinkItem',
      '/drinkItems',
      '/eventMedia',
      '/eventRequests',
      '/eventSettings',
      '/media',
      '/menuItem',
      '/menuItems',
      '/menuLayouts/restaurant',
      '/menus',
      '/menuSections',
      '/modifier',
      '/modifierGroup',
      '/modifierGroups',
      '/modifiers',
      '/pageOrder',
      '/profilePages',
      '/profileSections',
      '/restrictions',
      '/tags',
    ];
    protectedRoutes.forEach(route => {
      this.app.use(route, authorizationMiddleware);
    });

    // Register API routes here
    routes.forEach(route => {
      this.app.use(route.path, route.router);
    });
  }

  private setupSwagger() {
    // Workaround for conditionally import modules not needed on production
    let swaggerUi = null;
    let swaggerJSDoc = null;

    if (this.env === 'localhost') {
      swaggerUi = require('swagger-ui-express');
      swaggerJSDoc = require('swagger-jsdoc');
    }

    if (swaggerUi && swaggerJSDoc) {
      const options = {
        swaggerDefinition: {
          swagger: '2.0',
          info: {
            title: 'Super Backend API',
            version: '1.0.0',
            description:
              'Currently this API is planned to be used for TapManager and eventually TapAdmin web apps.  Open the link above with the json file and right click to "Save as" the json file to import into Postman.',
          },
        },
        apis: ['swagger.yaml'],
      };

      const specs = swaggerJSDoc(options);
      this.app.use('/api-docs', swaggerUi.serve);
      this.app.get(
        '/api-docs',
        swaggerUi.setup(null, {
          swaggerOptions: {
            url: '/api-docs/swagger.json',
          },
        }),
      );
      this.app.get('/api-docs/swagger.json', (req, res) => res.json(specs));
    }
  }

  private setupErrorHandling() {
    this.app.use(errorMiddleware);
  }

  async connectToDatabase() {
    try {
      await createConnection(dbConnection);
      console.log('Database connection established successfully');
    } catch (error) {
      console.error('Database connection error:', error);
      throw new Error('Database connection failed');
    }
  }

  public getServer() {
    return this.app;
  }

  public listen() {
    if (this.env !== 'test') {
      this.app.listen(this.port, () => {
        console.log(`=================================`);
        console.log(`======= ENV: ${this.env} =======`);
        console.log(`🚀 App listening on the port ${this.port}`);
        console.log(`=================================`);
        if (this.env === 'development') {
          console.log(`Database name: ${dbConnection.database}`);
          console.log(`Database host: ${dbConnection.host}`);
          console.log(`Database port: ${dbConnection.port}`);
          console.log(`Database user: ${dbConnection.username}`);
          console.log(`=================================`);
        }
      });
    }
  }
}

export default App;
