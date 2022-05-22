process.env.NODE_ENV = 'dev';
process.env.PORT = process.env.PORT || '4000';
process.env.HOST = '127.0.0.1';

process.env.CONCURRENCY_LIMIT = 10;

const oEnv = {
    dev: {
        BASE_URL: `http://${process.env.HOST}:${process.env.PORT}`,
    },
    prod: {
        BASE_URL: `http://${process.env.HOST}:${process.env.PORT}`,
    },
};

process.env.BASE_URL = oEnv[process.env.NODE_ENV].BASE_URL;

console.info(`${process.env.HOST} configured as ${process.env.NODE_ENV}  < / >`);

export {};
