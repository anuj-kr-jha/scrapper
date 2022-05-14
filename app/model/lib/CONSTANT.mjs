import pkg from 'mongoose';
const { Schema, model } = pkg;

const schema = new Schema(
    {
        factor: { type: Number, required: true, default: 0.3 },
        interval: { type: Number, required: true, default: 2 * 3600 }, // sec
        ig_urls: { type: [String], required: true },
        myFxBook_urls: { type: [String], required: true },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: false },
        capped: { size: 1e6, max: 1, autoIndexId: true },
    }
);

export const CONSTANT = model('CONSTANT', schema, 'CONSTANT');
