import { Document, Schema, model } from "mongoose";

export interface IUser {
    username: string;
    email: string;
    password: string;
    info: {
        firstName?: string;
        lastName?: string;
        bio?: string;
        profilePicture: Buffer;
    };
    postsIDs?: Schema.Types.ObjectId[];
    followingIDs?: Schema.Types.ObjectId[];
    followersIDs?: Schema.Types.ObjectId[];
    forgotPassword?: boolean;
}

export interface IUserDocument extends IUser, Document {
    _id: Schema.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

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
        required: true,
        trim: true,
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
            type: Buffer
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
    }
}, {
    timestamps: true
});

const User = model<IUserDocument>('User', UserSchema);

export default User;