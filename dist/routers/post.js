import { Router } from 'express';
import verifyAccessToken from '../middlewares/verifyAccessToken.js';
import Post from '../models/post.js';
import Comment from '../models/comment.js';
import User from '../models/user.js';
import getPosts from '../utils/getPostsPipeline.js';
import { toObjectId } from '../types.js';
import limitNewLines from '../utils/limitNewLinesInPost.js';
import { io } from '../index.js';
const router = Router();
router.use(verifyAccessToken);
// Creates a new post
router.post('/create', async (req, res) => {
    const authorId = req.userId;
    const { content } = req.body;
    if (content.length < 10 || content.length > 500) {
        return res.status(400).json({ message: 'Post must be between 10 and 500 characters' });
    }
    try {
        const newContent = limitNewLines(content);
        // finds user by id
        const user = await User.findById(authorId);
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        // creates new post and saves it to the database
        const post = new Post({
            author: toObjectId(authorId),
            authorUsername: user.username,
            content: newContent,
        });
        await post.save();
        // adds post id to user's postsIDs array and saves it to the database
        user.postsIDs?.push(post._id);
        await user.save();
        res.status(201).json({ post, message: 'Post created' });
        // handle notifications to mentioned users
        const mentionRegex = /@(\w+)/g;
        const matches = newContent.match(mentionRegex);
        if (matches) {
            for (const match of matches) {
                const username = match.slice(1);
                try {
                    const user = await User.findOne({ username });
                    if (!user)
                        continue;
                    const notification = `@${user.username} mentioned you in a post.`;
                    user.unreadNotifications.push(notification);
                    await user.save();
                    io.to(user._id.toString()).emit('newNotification', notification);
                }
                catch (err) {
                    console.log(err);
                }
            }
        }
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});
// Likes a post
router.post('/like/:id', async (req, res) => {
    const userId = req.userId;
    const postId = req.params.id;
    try {
        // finds post by id
        const post = await Post.findById(postId);
        // if post doesn't exist, return error
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        // if user has already liked the post, unlike it
        if (post.likes.includes(userId)) {
            post.likes = post.likes.filter(id => id !== userId);
            await post.save();
            return res.json({ post, message: 'Post unliked' });
        }
        // if user hasn't liked the post, like it
        post.likes.push(userId);
        await post.save();
        res.json({ post, message: 'Post liked' });
        // finds post's author by id
        const user = await User.findById(userId);
        const author = await User.findById(post.author);
        if (author) {
            author.unreadNotifications.push(`@${user?.username} liked your post.`);
            await author.save();
            io.to(author._id.toString()).emit('newNotification', `@${user?.username} liked your post.`);
        }
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});
// Create a new comment
router.post('/comments/create/:id', async (req, res) => {
    const authorId = req.userId;
    const postId = req.params.id;
    const { content } = req.body;
    if (content.length < 10 || content.length > 300) {
        return res.status(400).json({ message: 'Comment must be between 10 and 300 characters' });
    }
    if (!postId) {
        return res.status(400).json({ message: 'Post not found' });
    }
    try {
        const newContent = limitNewLines(content);
        // finds post by id
        const post = await Post.findById(postId);
        // finds user by id
        const user = await User.findById(authorId);
        // if post doesn't exist, return error
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        // if user doesn't exist, return error
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // creates new comment and saves it to the database
        const comment = new Comment({
            author: toObjectId(authorId),
            authorUsername: user.username,
            content: newContent,
            postId: toObjectId(postId),
        });
        await comment.save();
        // adds comment to post
        post.comments.push(comment._id);
        await post.save();
        const newComment = {
            ...comment.toObject(),
            authorVerified: user.verified,
        };
        res.status(201).json({ comment: newComment, message: 'Comment created' });
        // finds post's author by id
        const postAuthor = await User.findById(post?.author);
        // sends notification to post's author
        if (postAuthor) {
            const notification = `@${user.username} commented on your post.`;
            postAuthor.unreadNotifications.push(notification);
            await postAuthor.save();
            io.to(postAuthor._id.toString()).emit('newNotification', notification);
        }
        // handle notifications to mentioned users
        const mentionRegex = /@(\w+)/g;
        const matches = newContent.match(mentionRegex);
        if (matches && matches.some(mention => mention !== postAuthor?.username)) {
            for (const match of matches) {
                const username = match.slice(1);
                try {
                    const user = await User.findOne({ username });
                    if (!user)
                        continue;
                    user.unreadNotifications.push(`@${user.username} mentioned you in a comment.`);
                    await user.save();
                    io.to(user._id.toString()).emit('newNotification', `@${user.username} mentioned you in a comment.`);
                }
                catch (err) {
                    console.log(err);
                }
            }
        }
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});
// Likes a comment
router.post('/comments/like/:id', async (req, res) => {
    const userId = req.userId;
    const commentId = req.params.id;
    try {
        // finds comment by id
        const comment = await Comment.findById(commentId);
        // finds user by id
        const user = await User.findById(userId);
        // if comment doesn't exist, return error
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }
        // if user doesn't exist, return error
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // if user has already liked the comment, unlike it
        if (comment.likes.includes(userId)) {
            comment.likes = comment.likes.filter(id => id !== userId);
            await comment.save();
            return res.json({ comment, message: 'Comment unliked' });
        }
        // if user hasn't liked the comment, like it
        comment.likes.push(userId);
        await comment.save();
        res.json({ comment, message: 'Comment liked' });
        // finds comment's author by id
        const commentAuthor = await User.findById(comment?.author);
        if (commentAuthor) {
            const notification = `@${user?.username} liked your comment.`;
            commentAuthor.unreadNotifications.push(notification);
            await commentAuthor.save();
            io.to(commentAuthor._id.toString()).emit('newNotification', notification);
        }
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});
router.get('/comments/:postId', async (req, res) => {
    const postId = req.params.postId;
    const page = req.query.page ? parseInt(req.query.page.toString()) : 1;
    const limit = 5;
    const skip = (page - 1) * limit;
    try {
        if (!postId)
            return res.status(400).json({ message: 'Post not found' });
        const comments = await Comment.aggregate([
            { $match: { postId: toObjectId(postId) } },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
            {
                $lookup: {
                    from: 'users',
                    localField: 'author',
                    foreignField: '_id',
                    as: 'authorData',
                }
            },
            {
                $addFields: {
                    liked: { $in: [req.userId, "$likes"] },
                    authorVerified: { $arrayElemAt: ["$authorData.verified", 0] },
                }
            }
        ]);
        res.json({ comments });
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});
// Gets all posts made by people user follows
router.get('/', async (req, res) => {
    const userId = req.userId;
    const page = req.query.page ? parseInt(req.query.page.toString()) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit.toString()) : 10;
    const skip = (page - 1) * limit;
    try {
        // finds user
        const user = await User.findById(userId);
        // if user doesn't exist, return error
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const posts = await getPosts({ author: { $in: user.followingIDs } }, { createdAt: -1 }, skip, limit, req.userId);
        const numPosts = await Post.countDocuments({ author: { $in: user.followingIDs } });
        res.json({ posts, numPosts });
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});
// Gets all posts with a certain hashtag
router.get('/hashtag/:hashtag', async (req, res) => {
    const hashtag = req.params.hashtag;
    const page = req.query.page ? parseInt(req.query.page.toString()) : 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    try {
        const regexPattern = new RegExp(`#${hashtag}(?!\\w)`, 'i');
        const posts = await getPosts({ content: { $regex: regexPattern } }, { numLikes: -1, createdAt: -1 }, skip, limit, req.userId);
        const postsNum = await Post.countDocuments({ content: { $regex: regexPattern } });
        res.json({ posts, postsNum });
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});
// Gets all posts where user is mentioned
router.get('/mention/:username', async (req, res) => {
    const username = req.params.username;
    const page = req.query.page ? parseInt(req.query.page.toString()) : 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    try {
        const regexPattern = new RegExp(`@${username}(?!\\w)`, 'i');
        const posts = await getPosts({ content: { $regex: regexPattern } }, { numLikes: -1, createdAt: -1 }, skip, limit, req.userId);
        res.json({ posts });
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});
export default router;
