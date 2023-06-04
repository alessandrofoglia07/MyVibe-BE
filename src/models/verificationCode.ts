import { Document, Schema, model } from "mongoose";

interface IVerificationCode {
    username: string;
    email: string;
    code: number;
}

interface IVerificationCodeDocument extends IVerificationCode, Document { }

const VerificationCodeSchema = new Schema<IVerificationCodeDocument>({
    username: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 20
    },
    email: {
        type: String,
        required: true,
        trim: true,
        minlength: 5,
        maxlength: 50
    },
    code: {
        type: Number,
        required: true,
        trim: true,
        length: 6
    }
});

const VerificationCode = model<IVerificationCodeDocument>('VerificationCode', VerificationCodeSchema);

export default VerificationCode;