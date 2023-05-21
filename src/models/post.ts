import { Document, Schema, model } from "mongoose";

/* Post interface
author: author's _id
content: post's content
likes: array of users' _id who liked the post
comments: array of comments' _id
*/
export interface IPost {
    author: string;
    content: string;
    likes: string[];
    comments: string[];
}

export interface IPostDocument extends IPost, Document { }

const PostSchema = new Schema<IPostDocument>({
    author: {
        type: String,
        ref: "User",
        required: true
    },
    content: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
    },
    likes: [{
        type: [String],
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