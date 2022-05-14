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
                    //
                    long: { type: Number, required: true },
                    short: { type: Number, required: true },
                    ssi_signal: { type: String, enum: ['FLAT', 'BULLISH', 'BEARISH'], required: true },  // signal
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

export const MYFXBOOK_DATA = model('MYFXBOOK_DATA', schema, 'MYFXBOOK_DATA');
