import http from 'http';
import helmet from 'helmet';
import express from 'express';
import compression from 'compression';
import { router } from '../app/routers/index.mjs';
process.env.PORT = process.env.PORT || 4000
class Server {
    constructor() {}

    async initialize() {
        this.app = express();
        this.httpServer = http.createServer(this.app);
        await this.setupMiddleware();
        await this.setupServer();
        global.app = this.app;
    }

    async setupMiddleware() {
        this.app.disable('etag'); //
        this.app.use(helmet());
        this.app.use(compression());
        this.app.use(express.json({ limit: 1e6 })); // 1mb
        this.app.use(express.urlencoded({ extended: true }));

        this.app.use((req, res, next) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
            res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
            next();
        });

        this.app.use('/', router);
    }

    async setupServer() {
        this.httpServer.timeout = 120e3; // 120*1000
        this.httpServer.listen(process.env.PORT, () => console.log(`Spinning on ${process.env.PORT} 🌀`));
    }
}

const server = new Server();
export { server };
