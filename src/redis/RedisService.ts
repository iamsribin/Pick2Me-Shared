import Redis from "ioredis";
import {
  GEO_KEY,
  GEO_KEY_RIDE,
  HEARTBEAT_PREFIX,
  IN_RIDE_HEARTBEAT_PREFIX,
  ONLINE_DRIVER_DETAILS_PREFIX,
} from "../constants/redis-keys";
import {
  Coordinates,
  NearbyDriver,
  OnlineDriverDetails,
} from "../interfaces/common-types";

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
      throw new Error(
        "REDIS_URL is not set. Provide url to RedisService.init(url)."
      );
    }
    const client = new Redis(url);
    this.instance = new RedisService(client);
    return this.instance;
  }

  public static getInstance() {
    if (!this.instance) {
      throw new Error(
        "RedisService not initialized. Call RedisService.init(url) first."
      );
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

  //BLACK LIST operations
  async addBlacklistedToken(token: string, expSeconds: number): Promise<void> {
    await this.redis.set(`blacklist:${token}`, "true", "EX", expSeconds);
  }

  public async checkBlacklistedToken(token: string): Promise<boolean> {
    const isBlacklisted = await this.redis.exists(`blacklist:${token}`);
    return !!isBlacklisted;
  }

  public async removeBlacklistedToken(token: string): Promise<boolean> {
    const result = await this.redis.del(`blacklist:${token}`);
    return result > 0;
  }

  // CRUD operation
  public async set(key: string, value: any, ttlSeconds = 30): Promise<void> {
    await this.redis.set(key, value, "EX", ttlSeconds);
  }

  public async get(key: string) {
    return await this.redis.get(key);
  }

  public async remove(key: string): Promise<boolean> {
    const result = await this.redis.del(key);
    return result > 0;
  }

  // public async setHeartbeat(
  //   driverId: string,
  //   ttl: number = 120
  // ): Promise<void> {
  //   await this.redis.set(`${HEARTBEAT_PREFIX}${driverId}`, "1", "EX", ttl);
  // }

  // public async checkHeartbeat(driverId: string): Promise<boolean> {
  //   const exists = await this.redis.exists(`${HEARTBEAT_PREFIX}${driverId}`);
  //   return exists === 1;
  // }

private getHeartbeatKey(driverId: string, inRide = false) {
  return `${inRide ? IN_RIDE_HEARTBEAT_PREFIX : HEARTBEAT_PREFIX}${driverId}`;
}

public async setHeartbeat(driverId: string, ttl = 120, inRide = false) {
  await this.redis.set(this.getHeartbeatKey(driverId, inRide), "1", "EX", ttl);
}

public async checkHeartbeat(driverId: string, inRide = false) {
  const exists = await this.redis.exists(this.getHeartbeatKey(driverId, inRide));
  return exists === 1;
}

  //online driver methods
  public async setOnlineDriver(
    driverDetails: OnlineDriverDetails,
    location: Coordinates
  ): Promise<void> {
    const onlineDriverPrefix = `${ONLINE_DRIVER_DETAILS_PREFIX}${driverDetails.driverId}`;

    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);

    const ttl = Math.floor((midnight.getTime() - now.getTime()) / 1000);

    await this.redis.hset(onlineDriverPrefix, driverDetails);
    await this.redis.expire(onlineDriverPrefix, ttl);

    await this.redis.geoadd(
      GEO_KEY,
      location.longitude,
      location.latitude,
      driverDetails.driverId
    );
  }

  public async getOnlineDriverDetails(
    driverId: string
  ): Promise<OnlineDriverDetails | null> {
    const key = `${ONLINE_DRIVER_DETAILS_PREFIX}${driverId}`;
    const data = await this.redis.hgetall(key);

    if (!data || Object.keys(data).length === 0) return null;
    const details: OnlineDriverDetails = {
      driverId: data.driverId,
      driverNumber: data.driverNumber,
      name: data.name,
      cancelledRides: Number(data.cancelledRides),
      rating: Number(data.rating),
      vehicleModel: data.vehicleModel,
      driverPhoto: data.driverPhoto,
      vehicleNumber: data.vehicleNumber,
      stripeId: data.stripeId || undefined,
      stripeLinkUrl: data.stripeLinkUrl || undefined,
      sessionStart: data.sessionStart ? Number(data.sessionStart) : undefined,
      lastSeen: data.lastSeen ? Number(data.lastSeen) : undefined,
    };

    return details;
  }

  public async removeOnlineDriver(driverId: string): Promise<void> {
    const onlineDriverPrefix = `${ONLINE_DRIVER_DETAILS_PREFIX}${driverId}`;

    await this.redis.del(onlineDriverPrefix);
    await this.redis.zrem(GEO_KEY, driverId);
  }

  // online driver geo method
  public async updateOnlineDriverGeo(
    driverId: string,
    location: Coordinates
  ): Promise<void> {
    await this.redis.geoadd(
      GEO_KEY,
      location.longitude,
      location.latitude,
      driverId
    );
  }

  public async removeOnlineDriverGeo(driverId: string): Promise<void> {
    await this.redis.zrem(GEO_KEY, driverId);
  }

  public async findNearbyDrivers(
    latitude: number,
    longitude: number,
    radiusKm: number,
    limit = 20
  ): Promise<NearbyDriver[]> {
    const raw: any[] = (await this.redis.geosearch(
      GEO_KEY,
      "FROMLONLAT",
      longitude,
      latitude,
      "BYRADIUS",
      radiusKm,
      "km",
      "ASC",
      "WITHDIST",
      "WITHCOORD",
      "COUNT",
      limit
    )) as any;

    if (!raw || raw.length === 0) return [];

    return raw
      .map((entry) => {
        // expected entry: [ member, distStr, [lonStr, latStr] ]
        const member = entry[0];
        const distStr = entry[1];
        const coordArr = entry[2];

        if (!member || !distStr || !Array.isArray(coordArr)) return null;

        const longitudeParsed = Number(coordArr[0]);
        const latitudeParsed = Number(coordArr[1]);

        if (
          !Number.isFinite(longitudeParsed) ||
          !Number.isFinite(latitudeParsed)
        ) {
          return null;
        }

        return {
          driverId: String(member),
          distanceKm: Number(distStr),
          longitude: longitudeParsed,
          latitude: latitudeParsed,
        } as NearbyDriver;
      })
      .filter((x): x is NearbyDriver => x !== null);
  }

  public async moveDriverToInRideGeo(driverId: string, location: Coordinates): Promise<void> {
  await this.redis.zrem(GEO_KEY, driverId);

  await this.redis.geoadd(
    GEO_KEY_RIDE,
    location.longitude,
    location.latitude,
    driverId
  );
}


public async moveDriverOutOfInRideGeo(driverId: string, location?: Coordinates): Promise<void> {
  await this.redis.zrem(GEO_KEY_RIDE, driverId);

  if (location) {
    await this.redis.geoadd(
      GEO_KEY,
      location.longitude,
      location.latitude,
      driverId
    );
  }
}
}
