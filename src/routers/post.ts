import express, { Response, Router } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { verifyAccessToken, AuthRequest } from './auth.js';
import Post from '../models/post.js';
import Comment from '../models/comment.js';
import User from '../models/user.js';

dotenv.config();

const router = Router();

router.use(cors());
router.use(express.json());
router.use(verifyAccessToken);

// Creates a new post
router.post('/create', async (req: AuthRequest, res: Response) => {
    const authorId = req.userId;
    const { content } = req.body;

    if (content.length < 10 || content.length > 500) {
        return res.send({ message: 'Post must be between 10 and 500 characters' });
    }

    try {

        // finds user by id
        const user = await User.findById(authorId);

        if (!user) return res.send({ message: 'User not found' });

        // creates new post and saves it to the database
        const post = new Post({
            author: authorId,
            authorUsername: user.username,
            content
        });
        await post.save();

        // adds post id to user's postsIDs array and saves it to the database
        user.postsIDs?.push(post._id);
        await user.save();

        res.status(201).send({ post, message: 'Post created' });
    } catch (err) {
        console.log(err);
    }
});

//Likes a post
router.post('/like/:id', async (req: AuthRequest, res: Response) => {
    const userId = req.userId;
    const postId = req.params.id;

    try {
        // finds post by id
        const post = await Post.findById(postId);

        // if post doesn't exist, return error
        if (!post) {
            return res.send({ message: 'Post not found' });
        }

        // if user has already liked the post, unlike it
        if (post.likes.includes(userId!)) {
            post.likes = post.likes.filter(id => id === userId);
            await post.save();
            return res.send({ post, message: 'Post unliked' });
        }

        // if user hasn't liked the post, like it
        post.likes.push(userId!);
        await post.save();

        res.send({ post, message: 'Post liked', });
    } catch (err) {
        console.log(err);
    }
});

// Create a new comment
router.post('/comments/create/:id', async (req: AuthRequest, res: Response) => {
    const authorId = req.userId;
    const postId = req.params.id;
    const { content } = req.body;

    if (content.length < 10 || content.length > 300) {
        return res.send({ message: 'Comment must be between 10 and 300 characters' });
    }

    if (!postId) {
        return res.send({ message: 'Post not found' });
    }

    try {
        // finds post by id
        const post = await Post.findById(postId);

        // finds user by id
        const user = await User.findById(authorId);

        // if post doesn't exist, return error
        if (!post) {
            return res.send({ message: 'Post not found' });
        };

        // if user doesn't exist, return error
        if (!user) {
            return res.send({ message: 'User not found' });
        };

        // creates new comment and saves it to the database
        const comment = new Comment({
            author: authorId,
            authorUsername: user.username,
            content,
            postId
        });
        await comment.save();

        // adds comment to post
        post.comments.push(comment._id);
        await post.save();

        res.status(201).send({ comment, message: 'Comment created' });
    } catch (err) {
        console.log(err);
    }
});

// Likes a comment
router.post('/comments/like/:id', async (req: AuthRequest, res: Response) => {
    const userId = req.userId;
    const commentId = req.params.id;

    try {
        // finds comment by id
        const comment = await Comment.findById(commentId);

        // if comment doesn't exist, return error
        if (!comment) {
            return res.status(404).send({ message: 'Comment not found' });
        }

        // if user has already liked the comment, unlike it
        if (comment.likes.includes(userId!)) {
            comment.likes = comment.likes.filter(id => id === userId);
            await comment.save();
            return res.send({ comment, message: 'Comment unliked' });
        }

        // if user hasn't liked the comment, like it
        comment.likes.push(userId!);
        await comment.save();

        res.send({ comment, message: 'Comment liked' });
    } catch (err) {
        console.log(err);
    }
});

router.get('/comments/:postId', async (req: AuthRequest, res: Response) => {
    const postId = req.params.postId;
    const page = req.query.page ? parseInt(req.query.page.toString()) : 1;
    const limit = 5;
    const skip = (page - 1) * limit;

    try {
        if (!postId) return res.send({ message: 'Post not found' });

        const comments = await Comment.find({ postId }).sort({ createdAt: -1 }).skip(skip).limit(limit);

        const commentsWithLikes = comments.map(comment => {
            return {
                ...comment.toObject(),
                liked: comment.likes.includes(req.userId!)
            };
        });

        res.send({ comments: commentsWithLikes });
    } catch (err) {
        console.log(err);
    }
});

// Gets all posts made by people user follows
router.get('/', async (req: AuthRequest, res: Response) => {
    const userId = req.userId;

    try {
        // finds user
        const user = await User.findById(userId);

        // if user doesn't exist, return error
        if (!user) {
            return res.send({ message: 'User not found' });
        }

        // finds post made by people user follows
        const posts = (await Post.find({ author: { $in: user.followingIDs } }).sort({ createdAt: -1 }).limit(50)).map(post => {
            return {
                ...post.toObject(),
                liked: post.likes.includes(userId!)
            };
        });

        res.send({ posts });
    } catch (err) {
        console.log(err);
    }
});

export default router;