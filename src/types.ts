import { Request } from "express";
import mongoose, { ObjectId, Document } from "mongoose";

export interface AuthRequest extends Request {
    userId?: string;
};

export type ObjectIdConstructor = {
    (str: string): ObjectId;
    new(str: string): ObjectId;
};

export interface IUserChanged {
    _id: string;
    username: string;
    email: string;
    info: any;
    postsIDs: string[];
    followingIDs: string[];
    followersIDs: string[];
    createdAt: Date;
};

export interface IUser {
    username: string;
    email: string;
    password: string;
    info: {
        firstName?: string;
        lastName?: string;
        bio?: string;
        profilePicture: string;
    };
    postsIDs?: ObjectId[];
    followingIDs?: ObjectId[];
    followersIDs?: ObjectId[];
    forgotPassword?: boolean;
    verified: boolean;
    verificationCode?: string;
    unreadNotifications: string[];
};

export interface IUserDocument extends IUser, Document {
    _id: ObjectId;
    createdAt: Date;
    updatedAt: Date;
};

export interface IComment {
    author: ObjectId;
    authorUsername: string;
    content: string;
    likes: string[];
    postId: ObjectId;
};

export interface ICommentDocument extends IComment, Document { };

/* Post interface
author: author's _id
content: post's content
likes: array of users' _id who liked the post
comments: array of comments' _id
*/
export interface IPost {
    author: ObjectId;
    authorUsername: string;
    content: string;
    likes: string[];
    comments: string[];
};

export interface IPostDocument extends IPost, Document { };

export interface IVerificationCode {
    username: string;
    email: string;
    code: number;
};

export interface IVerificationCodeDocument extends IVerificationCode, Document { };

interface IBannedID {
    userId: ObjectId;
    bannedAt: Date;
}

export interface IBannedIDDocument extends IBannedID, Document { };

export const toObjectId = (str: string): ObjectId => new (mongoose.Types.ObjectId as unknown as ObjectIdConstructor)(str);