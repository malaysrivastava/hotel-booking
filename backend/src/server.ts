import App from './app';
import RoomController from './controllers/room.controller'
import redisHelper from './redisHelper'
require('dotenv').config();

(async ()=>{
    try {
        const app = new App([new RoomController()]);
        //start app server
        app.listen(process.env.PORT as string);
        //redisConnection
        const isRedisConnected = await redisHelper.connectRedis();
        if (!isRedisConnected) throw new Error("Unable to connect redis");
    } catch (error) {
        console.log('Error:',error);
    }
})();