import { getEnvOrThrow } from "../common/utils/util";

export const isProduction = getEnvOrThrow('NODE_ENV') === 'production';
