import { Schema, model } from "mongoose";
const PostSchema = new Schema({
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
const Post = model("Post", PostSchema);
export default Post;
