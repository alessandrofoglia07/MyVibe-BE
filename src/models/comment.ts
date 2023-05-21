import { Document, Schema, model } from "mongoose";

export interface IComment {
    author: string;
    content: string;
    likes: string[];
    postId: string;
}

export interface ICommentDocument extends IComment, Document { }

const CommentSchema = new Schema<ICommentDocument>({
    author: {
        type: String,
        ref: "User",
        required: true
    },
    content: {
        type: String,
        required: true,
        trim: true,
        maxlength: 300
    },
    likes: [{
        type: [String],
        ref: "User",
        default: []
    }],
    postId: {
        type: String,
        ref: "Post",
        required: true
    }
}, {
    timestamps: true
});

const Comment = model<ICommentDocument>("Comment", CommentSchema);

export default Comment;