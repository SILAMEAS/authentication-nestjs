import type { StringValue } from 'ms';
export interface Env {
  DATABASE_URL: string;
  JWT_ACCESS_SECRET: string;
  JWT_ACCESS_EXP_IN: StringValue;
  JWT_REFRESH_EXP_IN: StringValue;
  RESENT_API_KEY: string;
  APP_URL: string;
  JWT_REFRESH_SECRET: string;
  PORT: number;
}
