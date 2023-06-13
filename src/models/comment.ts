import { Schema, model } from "mongoose";
import { ICommentDocument } from "../types.js";

const CommentSchema = new Schema<ICommentDocument>({
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
        maxlength: 300
    },
    likes: [{
        type: String,
        ref: "User",
        default: []
    }],
    postId: {
        type: Schema.Types.ObjectId,
        ref: "Post",
        required: true
    }
}, {
    timestamps: true
});

const Comment = model<ICommentDocument>("Comment", CommentSchema);

export default Comment;