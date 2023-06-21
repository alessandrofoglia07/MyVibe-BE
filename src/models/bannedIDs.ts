import { Schema, model } from 'mongoose';
import { IBannedIDDocument } from '../types.js';

const BannedIDSchema = new Schema<IBannedIDDocument>({
    userId: {
        type: Schema.Types.ObjectId,
        required: true,
        unique: true,
    },
    bannedAt: {
        type: Date,
        required: true,
        default: Date.now()
    }
}, {
    timestamps: true
});

const BannedID = model<IBannedIDDocument>('BannedID', BannedIDSchema);

export default BannedID;