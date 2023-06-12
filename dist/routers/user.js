import express, { Router } from 'express';
import cors from 'cors';
import User from '../models/user.js';
import Post from '../models/post.js';
import { verifyAccessToken } from './auth.js';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { upload } from '../index.js';
import path from 'path';
dotenv.config();
const router = Router();
router.use(cors());
router.use(express.json());
router.use(verifyAccessToken);
const toObjectId = (str) => new mongoose.Types.ObjectId(str);
// Gets all people user follows
router.get('/following', async (req, res) => {
    const userId = req.userId;
    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(400).send({ message: 'User not found' });
        }
        const following = await User.find({ _id: { $in: user.followingIDs } });
        const usernames = following.map(user => user.username);
        res.send({ usernames });
    }
    catch (err) {
        console.log(err);
    }
});
// Gets a user's pfp 
router.get('/pfp/:username', async (req, res) => {
    const { username } = req.params;
    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.send({ message: 'User not found' });
        }
        if (user.info.profilePicture === '') {
            return res.send({ message: 'No profile picture' });
        }
        const __filename = path.resolve();
        const imagePath = path.join(__filename, 'public', 'images', user.info.profilePicture);
        res.sendFile(imagePath);
    }
    catch (err) {
        console.log(err);
    }
});
// Gets a user's profile
router.get('/profile/:username', async (req, res) => {
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
        const objectId = toObjectId(userId);
        const isFollowing = user.followersIDs?.includes(objectId);
        // check if profile is the user's profile
        const isProfile = userId === user._id.toString();
        res.send({ message: 'User found', user: { _id, username, email, info, postsIDs, followingIDs, followersIDs, createdAt }, isFollowing, isProfile });
    }
    catch (err) {
        console.log(err);
    }
});
// Modifies a user's profile
router.patch('/profile/:username', async (req, res) => {
    const { username } = req.params;
    const userId = req.userId;
    const changed = req.body.user;
    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.send({ message: 'User not found' });
        }
        // check if profile is the user's profile
        if (userId !== user._id.toString()) {
            return res.send({ message: 'Unauthorized' });
        }
        // update user info
        user.info.firstName = changed.info.firstName;
        user.info.lastName = changed.info.lastName;
        user.info.bio = changed.info.bio;
        user.username = changed.username;
        await user.save();
        res.send('User updated');
    }
    catch (err) {
        console.log(err);
    }
});
// Modifies a user's profile picture
router.patch('/profile/:username/uploadPfp', (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            console.log(err);
            return res.send({ message: 'Error uploading file' });
        }
        if (!req.file) {
            return res.send({ message: 'No file uploaded' });
        }
        const { filename } = req.file;
        const { username } = req.params;
        const userId = req.userId;
        try {
            const user = await User.findOne({ username });
            if (!user) {
                return res.send({ message: 'User not found' });
            }
            // check if profile is the user's profile
            if (userId !== user._id.toString()) {
                return res.send({ message: 'Unauthorized' });
            }
            // update user profile picture
            user.info.profilePicture = filename;
            await user.save();
            res.send({ message: 'Profile picture updated', filename });
        }
        catch (err) {
            console.log(err);
        }
    });
});
// Gets a user's posts
router.get('/posts/:username', async (req, res) => {
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
                liked: post.likes.includes(userId)
            };
        });
        res.send({ message: 'User found', posts });
    }
    catch (err) {
        console.log(err);
    }
});
// Follows a user
router.post('/follow/:id', async (req, res) => {
    const userId = req.userId;
    const toFollowId = req.params.id;
    try {
        const user = await User.findById(userId);
        const toFollow = await User.findById(toFollowId);
        const objUserId = toObjectId(userId);
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
    }
    catch (err) {
        console.log(err);
    }
});
// Unfollows a user
router.post('/unfollow/:id', async (req, res) => {
    const userId = req.userId;
    const toUnfollowId = req.params.id;
    try {
        const user = await User.findById(userId);
        const toUnfollow = await User.findById(toUnfollowId);
        const objUserId = toObjectId(userId);
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
    }
    catch (err) {
        console.log(err);
    }
});
// Searches for users
router.get('/search', async (req, res) => {
    const { search = '', limit = '0', page = '1' } = req.query;
    const regex = new RegExp(search.toString(), 'i');
    try {
        const users = await User.aggregate([
            {
                $match: {
                    $or: [
                        { username: regex },
                        { 'info.firstName': regex },
                        { 'info.lastName': regex }
                    ]
                }
            },
            {
                $addFields: {
                    followersCount: { $size: "$followersIDs" }
                }
            },
            { $sort: { followersCount: -1 } },
            { $limit: Number(limit) },
            { $skip: (Number(page) - 1) * Number(limit) }
        ]);
        const usersCount = await User.countDocuments({
            $or: [
                { username: regex },
                { 'info.firstName': regex },
                { 'info.lastName': regex }
            ]
        });
        res.status(200).json({ users, usersCount });
    }
    catch (err) {
        console.log(err);
    }
});
export default router;
