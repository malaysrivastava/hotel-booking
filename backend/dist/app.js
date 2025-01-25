"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
class App {
    constructor(controllers) {
        this.listen = (PORT) => {
            this.server = this.app.listen(PORT || 7000, () => {
                console.log(`Server running on ${PORT}`);
            });
        };
        this.getServer = () => {
            return this.server;
        };
        this.intializeMiddlewares = () => {
            this.app.use((0, cors_1.default)({
                credentials: true,
                origin: ['https://booking-system-malay.netlify.app', 'http://localhost:4200'],
            }));
            this.app.use(body_parser_1.default.json());
        };
        this.intializeControllers = (controllers) => {
            //health check API
            this.app.get('/', (res) => {
                res.status(200).send('API service is UP');
            });
            //routing for multiple routes
            controllers.forEach((controller) => {
                this.app.use('/api', controller.router);
            });
            //unknown route handler
            this.app.all('*', (res) => {
                res.status(404).send('No route found');
            });
        };
        this.app = (0, express_1.default)();
        this.intializeMiddlewares();
        this.intializeControllers(controllers);
    }
}
;
exports.default = App;
//# sourceMappingURL=app.js.map