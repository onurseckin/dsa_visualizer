import { batchMlPlatformCapstone } from "./batchMlPlatformCapstone";
import { mlIncidentCapstone } from "./mlIncidentCapstone";
import { realtimeMlPlatformCapstone } from "./realtimeMlPlatformCapstone";

export const ML_PLATFORM_CAPSTONES = Object.freeze([
  batchMlPlatformCapstone,
  realtimeMlPlatformCapstone,
  mlIncidentCapstone,
] as const);

export { batchMlPlatformCapstone, realtimeMlPlatformCapstone, mlIncidentCapstone };
