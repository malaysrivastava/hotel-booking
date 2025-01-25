/* @ts-ignore */
// @ts-nocheck
import * as redis from "redis";

global {
  var redis;
}

class Redis {
  static instance: Redis = null;

  static getInstance = () => {
    if (!Redis.instance) {
      Redis.instance = new Redis();
      delete Redis.constructor;
    }
    return Redis.instance;
  };

  // this is client variable declared for accessing redis client in the whole class
  public client: redis.RedisClientType;

  // connect the the redis server
  public async connectRedis() {
    try {
      this.client = redis.createClient({
        username: 'default',
        password: process.env.REDIS_PASS,
        socket: {
            host: process.env.REDIS_HOST,
            port: process.env.REDIS_PORT
        }
    });
      // bind the redis client event
      this._bindRedisClientEvents();

      await this.client.connect();

      return true;
    } catch (err) {
      console.error("Redis Connection Error: ", err);
      return false;
    }
  }
  private _bindRedisClientEvents = () => {
    try {
      // fired when client is trying to connect to redis server
      this.client.on("connect", () => {
        console.log("Connecting to redis server");
      });

      // fired when client is connected to redis server
      this.client.on("ready", () => {
        global.redis = this.client;
        console.log("Redis connected");
      });
      // fired when error thrown by redis server
      this.client.on("error", (err: Error) => {
        console.log("Redis Server Error: ", err);
      });

      // fired by redis client try to reconnect to server
      this.client.on("end", () => {
        console.log("Redis client disconnected");
      });

      // fired by redis client try to reconnect to server
      this.client.on("reconnecting", () => {
        console.log("Reconnecting to redis server");
      });
    } catch (err) {
      console.error("Error while binding the redis events: ", err);
    }
  };
  // Set cache with an expiry time
  public async setCache(
    redisKey: string,
    data: any,
    expiry = DEFAULT_VALUE.EXPIRY_TIME,
  ) {
    try {
      await this.client.set(redisKey, JSON.stringify(data));
      await this.client.expire(redisKey, expiry);
    } catch (err) {
      log.red("Error setting cache: ", err);
    }
  }

  public removeFromRedis = async (key: string) => {
    try {
      // find is the hashmap is present in the redis storage
      const exists = await this.client.exists(key);
      if (exists) {
        // if exists then delete the data with the key provided of the hash map
        const result = await this.client.del(key);

        return result;
      }
    } catch (error) {
      return null;
    }
  };

  // Get cached data
  public async getCache(redisKey: string) {
    try {
      const cachedData = await this.client.get(redisKey);
      return cachedData ? JSON.parse(cachedData) : null;
    } catch (err) {
      console.error("Error getting cache: ", err);
      return null;
    }
  }
}
const redisHelper = Redis.getInstance();
export default redisHelper;