import Redis from "ioredis";
import {
  GEO_KEY,
  GEO_KEY_RIDE,
  HEARTBEAT_PREFIX,
  ONLINE_DRIVER_DETAILS_PREFIX,
  RIDE_DRIVER_DETAILS_PREFIX,
} from "../constants/redis-keys";
import { OnlineDriverDetails } from "../interfaces/common-types";

export class RedisService {
  private static instance: RedisService | null = null;
  private redis: Redis;

  private constructor(redisClient: Redis) {
    this.redis = redisClient;
    this.redis.on("error", (err) => {
      console.error("Redis error:", err);
    });
  }


  public static init(url?: string) {
    if (this.instance) return this.instance;
    if (!url) {
      throw new Error("REDIS_URL is not set. Provide url to RedisService.init(url).");
    }
    const client = new Redis(url);
    this.instance = new RedisService(client);
    return this.instance;
  }

  public static getInstance() {
 if (!this.instance) {
    throw new Error("RedisService not initialized. Call RedisService.init(url) first.");
    }
    return this.instance as RedisService;
  }

  public raw() {
    return this.redis;
  }

  // ping / health
  public async ping() {
    return this.redis.ping();
  }

  // HEARTBEAT
  public async setHeartbeat(driverId: string, ttlSeconds = 120) {
    const key = `${HEARTBEAT_PREFIX}${driverId}`;
    await this.redis.set(key, Date.now().toString(), "EX", ttlSeconds);
  }

  public async isDriverOnline(driverId: string) {
    const key = `${HEARTBEAT_PREFIX}${driverId}`;
    const val = await this.redis.get(key);
    return !!val;
  }

  // in ride driver
  public async setInRideDriverDetails(driverDetails: OnlineDriverDetails, ttlSeconds = 120) {
    const prefix =RIDE_DRIVER_DETAILS_PREFIX;
    const key = `${prefix}${driverDetails.driverId}`;
    await this.redis.set(key, JSON.stringify(driverDetails), "EX", ttlSeconds);
  }

    public async getInRideDriverDetails(driverId: string) {
    const prefix = RIDE_DRIVER_DETAILS_PREFIX;
    const key = `${prefix}${driverId}`;
    const val = await this.redis.get(key);
    return val ? (JSON.parse(val) as OnlineDriverDetails) : null;
  }
  
    public async removeInRideDriver(driverId: string) {
    const prefix = RIDE_DRIVER_DETAILS_PREFIX;
    const key = `${HEARTBEAT_PREFIX}${driverId}`;
    const detailsKey = `${prefix}${driverId}`;
    await this.redis.del([key, detailsKey]);
    await this.redis.zrem(GEO_KEY_RIDE, driverId);
  }

  //online driver 
    public async setOnlineDriverDetails(driverDetails: OnlineDriverDetails, ttlSeconds = 120) {
    const prefix = ONLINE_DRIVER_DETAILS_PREFIX;
    const key = `${prefix}${driverDetails.driverId}`;
    await this.redis.set(key, JSON.stringify(driverDetails), "EX", ttlSeconds);
  }

    public async getOnlineDriverDetails(driverId: string) {
    const prefix =ONLINE_DRIVER_DETAILS_PREFIX;
    const key = `${prefix}${driverId}`;
    const val = await this.redis.get(key);
    return val ? (JSON.parse(val) as OnlineDriverDetails) : null;
  }

    public async removeOnlineDriver(driverId: string) {
    const prefix =  ONLINE_DRIVER_DETAILS_PREFIX;
    const key = `${HEARTBEAT_PREFIX}${driverId}`;
    const detailsKey = `${prefix}${driverId}`;
    await this.redis.del([key, detailsKey]);
    await this.redis.zrem(GEO_KEY, driverId);
  }

  // GEO
  public async addDriverGeo(driverId: string, lng: number, lat: number, isRide = false) {
    const key = isRide ? GEO_KEY_RIDE : GEO_KEY;
    await this.redis.geoadd(key, lng, lat, driverId);
  }

  public async getDriverGeo(driverId: string, isRide = false) {
    const key = isRide ? GEO_KEY_RIDE : GEO_KEY;
    const pos = await this.redis.geopos(key, driverId);
    if (!pos || !pos[0]) return null;
    const [lng, lat] = pos[0] as [string, string];
    return { latitude: parseFloat(lat), longitude: parseFloat(lng) };
  }

  //BLACK LIST
  async addBlacklistedToken(token: string, expSeconds: number) {
  await this.redis.set(`blacklist:${token}`, "true", "EX", expSeconds);
}

  public async checkBlacklistedToken(token: string) {
    const isBlacklisted = await this.redis.exists(`blacklist:${token}`);
    return !!isBlacklisted;
  }

  public async removeBlacklistedToken(token: string) {
  const result = await this.redis.del(`blacklist:${token}`);
  return result > 0;
}

// CRUD
public async set(key: string, value:any, ttlSeconds = 30) {
  await this.redis.set(key, value, "EX", ttlSeconds);
}

public async get(key: string): Promise<string | null> {
  return await this.redis.get(key);
}

public async remove(key: string): Promise<boolean> {
  const result = await this.redis.del(key);
  return result > 0;
}
}
