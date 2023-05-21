import { Schema, model } from "mongoose";
const CommentSchema = new Schema({
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
const Comment = model("Comment", CommentSchema);
export default Comment;
