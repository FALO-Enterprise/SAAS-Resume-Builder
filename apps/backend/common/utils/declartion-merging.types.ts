/* eslint-disable */

import {
  UnifiedApiErrorResponse
} from '../middlewares/response.middleware'

import 'express-session'

declare module 'express-session' {
  interface SessionData {
    userId: string;
  }
}


export type MyEnvs = {
  PORT: string;
  NODE_ENV: 'development' | 'production' | 'test';
  SESSION_SECRET: string;
  JWT_SECRET: string;
  MONGODB_URL: string;
  DATABASE_URL: string;
};

declare global {
  namespace NodeJS {
    interface ProcessEnv extends MyEnvs { }
  }

  namespace Express {
    interface Response {
      create: (data: object) => this;
      ok: (data: object) => this;
      error: (err: UnifiedApiErrorResponse) => this;
    }
  }
}
