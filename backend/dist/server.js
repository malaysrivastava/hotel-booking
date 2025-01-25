"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const room_controller_1 = __importDefault(require("./controllers/room.controller"));
const redisHelper_1 = __importDefault(require("./redisHelper"));
require('dotenv').config();
(async () => {
    try {
        const app = new app_1.default([new room_controller_1.default()]);
        //start app server
        app.listen(process.env.PORT);
        //redisConnection
        const isRedisConnected = await redisHelper_1.default.connectRedis();
        if (!isRedisConnected)
            throw new Error("Unable to connect redis");
    }
    catch (error) {
        console.log('Error:', error);
    }
})();
//# sourceMappingURL=server.js.map