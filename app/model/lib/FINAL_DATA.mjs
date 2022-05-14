import pkg from 'mongoose';
const { Schema, model } = pkg;

const schema = new Schema(
    {
        data: {
            type: [
                {
                    _id: false,
                    currency: { type: String, required: true },
                    long: { type: Number, min: 0, max: 1, required: true },
                    short: { type: Number, min: 0, max: 1, required: true },
                    ssi_signal: { type: String, enum: ['FLAT', 'BULLISH', 'BEARISH'], required: true },
                    oi_signal: { type: String, enum: ['FLAT', 'BULLISH', 'BEARISH', 'NA'], required: true },
                },
            ],
            required: true,
        },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: false },
        capped: { size: 130e6, autoIndexId: true },
    }
);

schema.index({ created_at: -1 });

export const FINAL_DATA = model('FINAL_DATA', schema, 'FINAL_DATA');
