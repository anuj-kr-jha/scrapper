import pkg from 'mongoose';
const { Schema, model } = pkg;

const schema = new Schema(
    {
        data: {
            type: [
                {
                    _id: false,
                    currency: { type: String, required: true },
                    oi_signal: { type: String, enum: ['FLAT', 'BULLISH', 'BEARISH'], required: true },
                    net_long_percent: { type: Number, required: true },
                    net_short_percent: { type: Number, required: true },
                    change_in_longs: {
                        type: {
                            _id: false,
                            Daily: { type: Number, required: true },
                            Weekly: { type: Number, required: true },
                        },
                        required: true,
                    },
                    change_in_shorts: {
                        type: {
                            _id: false,
                            Daily: { type: Number, required: true },
                            Weekly: { type: Number, required: true },
                        },
                        required: true,
                    },
                    change_in_io: {
                        type: {
                            _id: false,
                            Daily: { type: Number, required: true },
                            Weekly: { type: Number, required: true },
                        },
                        required: true,
                    },
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

export const DAILYFX_DATA = model('DAILYFX_DATA', schema, 'DAILYFX_DATA');
