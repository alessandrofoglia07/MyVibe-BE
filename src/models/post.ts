import { Schema, model } from "mongoose";
import { IPostDocument } from "../types.js";

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