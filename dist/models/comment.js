import { Schema, model } from "mongoose";
const CommentSchema = new Schema({
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
const Comment = model("Comment", CommentSchema);
export default Comment;
