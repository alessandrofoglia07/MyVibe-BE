import { Schema, model } from "mongoose";
import { IUserDocument } from "../types.js";

const UserSchema = new Schema<IUserDocument>({
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
    password: {
        type: String,
        required: true
    },
    info: {
        firstName: {
            type: String,
            trim: true,
            minlength: 2,
            maxlength: 20
        },
        lastName: {
            type: String,
            trim: true,
            minlength: 2,
            maxlength: 20
        },
        bio: {
            type: String,
            trim: true,
            maxlength: 100
        },
        profilePicture: {
            type: String,
            default: ''
        },
        showEmail: {
            type: Boolean,
            default: false
        }
    },
    postsIDs: {
        type: [Schema.Types.ObjectId],
        ref: "Post",
        default: []
    },
    followingIDs: {
        type: [Schema.Types.ObjectId],
        ref: "User",
        default: []
    },
    followersIDs: {
        type: [Schema.Types.ObjectId],
        ref: "User",
        default: []
    },
    forgotPassword: {
        type: Boolean,
        default: false
    },
    verified: {
        type: Boolean,
        default: false,
        required: true
    },
    verificationCode: {
        type: String,
    },
    unreadNotifications: {
        type: [String],
        default: [],
        required: true
    }
}, {
    timestamps: true
});

const User = model<IUserDocument>('User', UserSchema);

export default User;