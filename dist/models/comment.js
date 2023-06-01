import { Schema, model } from "mongoose";
const CommentSchema = new Schema({
    author: {
        type: String,
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
const Comment = model("Comment", CommentSchema);
export default Comment;
