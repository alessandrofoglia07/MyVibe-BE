import { Document, Schema, model } from "mongoose";

export interface IComment {
    author: Schema.Types.ObjectId;
    content: string;
    likes: Schema.Types.ObjectId[];
}

export interface ICommentDocument extends IComment, Document { }

const CommentSchema = new Schema<ICommentDocument>({
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
    }]
}, {
    timestamps: true
});

const Comment = model<ICommentDocument>("Comment", CommentSchema);

export default Comment;