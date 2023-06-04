import express, { Response, Router } from 'express';
import cors from 'cors';
import User from '../models/user.js';
import Post from '../models/post.js';
import { AuthRequest, verifyAccessToken } from './auth.js';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const router = express.Router();

router.use(cors());
router.use(express.json());
router.use(verifyAccessToken);

type ObjectIdConstructor = {
    (str: string): mongoose.Schema.Types.ObjectId;
    new(str: string): mongoose.Schema.Types.ObjectId;
};

const toObjectId = (str: string): mongoose.Schema.Types.ObjectId => new (mongoose.Types.ObjectId as unknown as ObjectIdConstructor)(str);

// Gets all people user follows
router.get('/following', async (req: AuthRequest, res: Response) => {
    const userId = req.userId;

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(400).send({ message: 'User not found' });
        }

        const following: any[] = await User.find({ _id: { $in: user.followingIDs } });
        const usernames = following.map(user => user.username);

        res.send({ usernames });
    } catch (err) {
        console.log(err);
    }
});

// Gets a user's profile
router.get('/profile/:username', async (req: AuthRequest, res: Response) => {
    const { username } = req.params;
    const userId = req.userId;

    try {
        const user = await User.findOne({ username });

        if (!user) {
            return res.send({ message: 'User not found' });
        }

        // destructure user object
        const { _id, email, info, postsIDs, followingIDs, followersIDs, createdAt } = user;

        // check if user is following the profile
        const objectId = toObjectId(userId!);
        const isFollowing = user.followersIDs?.includes(objectId);

        // check if profile is the user's profile
        const isProfile = userId === user._id.toString();

        res.send({ message: 'User found', user: { _id, username, email, info, postsIDs, followingIDs, followersIDs, createdAt }, isFollowing, isProfile });
    } catch (err) {
        console.log(err);
    }
});

// Gets a user's posts
router.get('/posts/:username', async (req: AuthRequest, res: Response) => {
    const { username } = req.params;
    const userId = req.userId;

    try {
        const user = await User.findOne({ username });

        if (!user) {
            return res.send({ message: 'User not found' });
        }

        const posts = (await Post.find({ _id: { $in: user.postsIDs } }).sort({ createdAt: -1 }).limit(10)).map(post => {
            return {
                ...post.toObject(),
                liked: post.likes.includes(userId!)
            };
        });

        res.send({ message: 'User found', posts });
    } catch (err) {
        console.log(err);
    }
});

// Follows a user
router.post('/follow/:id', async (req: AuthRequest, res: Response) => {
    const userId = req.userId;
    const toFollowId = req.params.id;

    try {
        const user = await User.findById(userId);
        const toFollow = await User.findById(toFollowId);

        const objUserId = toObjectId(userId!);
        const objToFollowId = toObjectId(toFollowId);

        if (!user || !toFollow) {
            return res.send({ message: 'User not found' });
        }

        // check if user is already following the user
        if (user.followingIDs?.includes(objToFollowId)) {
            return res.send({ message: 'User already followed' });
        }

        // add user to following list
        user.followingIDs?.push(objToFollowId);
        await user.save();

        // add user to followers list
        toFollow.followersIDs?.push(objUserId);
        await toFollow.save();

        res.send({ message: 'User followed', followerID: objUserId });
    } catch (err) {
        console.log(err);
    }
});

// Unfollows a user
router.post('/unfollow/:id', async (req: AuthRequest, res: Response) => {
    const userId = req.userId;
    const toUnfollowId = req.params.id;

    try {
        const user = await User.findById(userId);
        const toUnfollow = await User.findById(toUnfollowId);

        const objUserId = toObjectId(userId!);
        const objToUnfollowId = toObjectId(toUnfollowId);

        if (!user || !toUnfollow) {
            return res.send({ message: 'User not found' });
        }

        // check if user is following the user
        if (!user.followingIDs?.includes(objToUnfollowId)) {
            return res.send({ message: 'User not followed' });
        }

        // remove user from following list
        user.followingIDs = user.followingIDs?.filter(id => id.toString() !== objToUnfollowId.toString());
        await user.save();

        // remove user from followers list
        toUnfollow.followersIDs = toUnfollow.followersIDs?.filter(id => id.toString() !== objUserId.toString());
        await toUnfollow.save();

        res.send({ message: 'User unfollowed', followerID: objUserId });
    } catch (err) {
        console.log(err);
    }
});

export default router;