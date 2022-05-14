import pkg from 'mongoose';
const { Schema, model } = pkg;

const schema = new Schema(
    {
        data: {
            type: [
                {
                    _id: false,
                    currency: { type: String, required: true },
                    percent: { type: Number, required: true },
                    longShort: { type: String, enum: ['long', 'short'], required: true },
                    //
                    long: { type: Number, required: true },
                    short: { type: Number, required: true },
                    signal: { type: String, enum: ['FLAT', 'BULLISH', 'BEARISH'], required: true },
                    ssi_signal: { type: String, enum: ['FLAT', 'BULLISH', 'BEARISH'], required: true },
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

export const IG_DATA = model('IG_DATA', schema, 'IG_DATA');
