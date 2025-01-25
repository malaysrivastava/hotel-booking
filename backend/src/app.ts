import cors from 'cors';
import express from 'express';
import {Response} from 'express';
import bodyParser from 'body-parser';
import Controller from './interfaces/controller.interface';
import { Server } from 'http';

class App{
    public app: express.Application;
    public req: express.Request;
    public res: express.Response;
    private server: Server ;

    constructor(controllers: Controller[]) {
        this.app = express();
        this.intializeMiddlewares();
        this.intializeControllers(controllers);
    }

    public listen = (PORT: string) => {
        this.server = this.app.listen(PORT || 7000, () => {
            console.log(`Server running on ${PORT}`);
        });
    }

    public getServer = ():Server => {
        return this.server;
    }

    private intializeMiddlewares = () =>{
        this.app.use(
            cors({
                credentials:true,
                origin:['https://booking-system-malay.netlify.app','http://localhost:4200'],
            })
        );
        this.app.use(bodyParser.json());
    }

    private intializeControllers =(controllers:Controller[])=>{
        //health check API
        this.app.get('/',(res:Response)=>{
             res.status(200).send('API service is UP');
        })
        //routing for multiple routes
        controllers.forEach((controller)=>{
            this.app.use('/api',controller.router);
        })
        //unknown route handler
        this.app.all('*',(res:Response)=>{
            res.status(404).send('No route found');
        })
    }
};

export default App;