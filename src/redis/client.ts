import { RedisService } from "./RedisService.js";

export function createRedisService(redisUrl: string) {
  return RedisService.init(redisUrl);
}

export function getRedisService(): RedisService {
  return RedisService.getInstance();
}
