"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
/* @ts-ignore */
// @ts-nocheck
const redis = __importStar(require("redis"));
var global;
(function (global) {
    var redis;
})(global || (global = {}));
class Redis {
    constructor() {
        this._bindRedisClientEvents = () => {
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
                this.client.on("error", (err) => {
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
            }
            catch (err) {
                console.error("Error while binding the redis events: ", err);
            }
        };
        this.removeFromRedis = async (key) => {
            try {
                // find is the hashmap is present in the redis storage
                const exists = await this.client.exists(key);
                if (exists) {
                    // if exists then delete the data with the key provided of the hash map
                    const result = await this.client.del(key);
                    return result;
                }
            }
            catch (error) {
                return null;
            }
        };
    }
    // connect the the redis server
    async connectRedis() {
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
        }
        catch (err) {
            console.error("Redis Connection Error: ", err);
            return false;
        }
    }
    // Set cache with an expiry time
    async setCache(redisKey, data, expiry = DEFAULT_VALUE.EXPIRY_TIME) {
        try {
            await this.client.set(redisKey, JSON.stringify(data));
            await this.client.expire(redisKey, expiry);
        }
        catch (err) {
            log.red("Error setting cache: ", err);
        }
    }
    // Get cached data
    async getCache(redisKey) {
        try {
            const cachedData = await this.client.get(redisKey);
            return cachedData ? JSON.parse(cachedData) : null;
        }
        catch (err) {
            console.error("Error getting cache: ", err);
            return null;
        }
    }
}
Redis.instance = null;
Redis.getInstance = () => {
    if (!Redis.instance) {
        Redis.instance = new Redis();
        delete Redis.constructor;
    }
    return Redis.instance;
};
const redisHelper = Redis.getInstance();
exports.default = redisHelper;
//# sourceMappingURL=redisHelper.js.map