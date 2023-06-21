import { Schema, model } from 'mongoose';
const BannedIDSchema = new Schema({
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
const BannedID = model('BannedID', BannedIDSchema);
export default BannedID;
