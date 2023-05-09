import { Schema, model } from "mongoose";
const VerificationCodeSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 20
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 5,
        maxlength: 50
    },
    code: {
        type: Number,
        required: true,
        trim: true,
        minlength: 6,
        maxlength: 6
    }
});
const VerificationCode = model('VerificationCode', VerificationCodeSchema);
export default VerificationCode;
