import { Schema, model } from "mongoose";
const PostSchema = new Schema({
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
const Post = model("Post", PostSchema);
export default Post;
