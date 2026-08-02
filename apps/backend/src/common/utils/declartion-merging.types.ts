/* eslint-disable */

import {
  UnifiedApiErrorResponse
} from '../middlewares/response.middleware'
import { Plan } from '@prisma/client';

import 'express-session'

declare module 'express-session' {
  interface SessionData {
    userId: string;
    oauth?: {
      provider: 'google' | 'github' | 'linkedin';
      state: string;
      codeVerifier: string;
      locale: 'en' | 'ar';
      createdAt: number;
    };
  }
}


export type MyEnvs = {
  PORT: string;
  NODE_ENV: 'development' | 'production' | 'test';
  SESSION_SECRET: string;
  JWT_SECRET: string;
  MONGODB_URL: string;
  DATABASE_URL: string;
  FRONTEND_URL: string;
  BACKEND_PUBLIC_URL: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  LINKEDIN_CLIENT_ID: string;
  LINKEDIN_CLIENT_SECRET: string;
};

declare global {
  namespace NodeJS {
    interface ProcessEnv extends MyEnvs { }
  }

  namespace Express {

    interface Request {
      user: {
        id: string
        email: string
        role: string
      }
      plan: Plan
    }

    interface Response {
      create: (data: object) => this;
      ok: (data: object) => this;
      error: (err: UnifiedApiErrorResponse) => this;
    }
  }
}
