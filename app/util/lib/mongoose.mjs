import pkg from 'mongoose';
const { connect, set, Types, Schema } = pkg;

class Mongoose {
    static id = Schema.Types.ObjectId;
    constructor() {
        this.options = {
            bufferCommands: true,
            dbName: process.env.DB,
            user: process.env.DB_USER,
            pass: process.env.DB_PASSWORD,
            autoIndex: true,
            autoCreate: true,
        };
    }
    async initialize() {
        set('bufferTimeoutMS', 2000);
        await connect(process.env.DB_URL, this.options);
        console.info('Mongoose Initialized ◙');
    }
    static mongify(id) {
        return new Types.ObjectId(id);
    }
}

const mongoose = new Mongoose();
export { mongoose, Mongoose, Types };