import { Document, Schema, model } from "mongoose";

/* Post interface
author: author's _id
content: post's content
likes: array of users' _id who liked the post
comments: array of comments' _id
*/
export interface IPost {
    author: Schema.Types.ObjectId;
    content: string;
    likes: Schema.Types.ObjectId[];
    comments: Schema.Types.ObjectId[];
}

export interface IPostDocument extends IPost, Document { }

const PostSchema = new Schema<IPostDocument>({
    author: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    content: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    },
    likes: [{
        type: [Schema.Types.ObjectId],
        ref: "User"
    }],
    comments: [{
        type: Schema.Types.ObjectId,
        ref: "Comment"
    }]
}, {
    timestamps: true
});

const Post = model<IPostDocument>("Post", PostSchema);

export default Post;