import { Document, Schema, model } from "mongoose";

/* Post interface
author: author's _id
content: post's content
likes: array of users' _id who liked the post
comments: array of comments' _id
*/
export interface IPost {
    author: Schema.Types.ObjectId;
    authorUsername: string;
    content: string;
    likes: string[];
    comments: string[];
}

export interface IPostDocument extends IPost, Document { }

const PostSchema = new Schema<IPostDocument>({
    author: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    authorUsername: {
        type: String,
        ref: "User",
        required: true
    },
    content: {
        type: String,
        required: true,
        trim: true,
        minlength: 10,
        maxlength: 500
    },
    likes: [{
        type: String,
        ref: "User",
        default: []
    }],
    comments: [{
        type: String,
        ref: "Comment",
        default: []
    }]
}, {
    timestamps: true
});

const Post = model<IPostDocument>("Post", PostSchema);

export default Post;