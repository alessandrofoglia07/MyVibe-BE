import { Router } from 'express';
import User from '../models/user.js';
import verifyAccessToken from '../middlewares/verifyAccessToken.js';
import { toObjectId } from '../types.js';
import { upload } from '../index.js';
import path from 'path';
import getPosts from '../utils/getPostsPipeline.js';
import { io } from '../index.js';
import checkBanned from '../middlewares/checkBanned.js';
const router = Router();
router.use(verifyAccessToken);
router.use(checkBanned);
// Gets all people user follows
router.get('/following/:username', async (req, res) => {
    const { username } = req.params;
    const { page = '1', limit = '10' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const following = await User.aggregate([
            { $match: { _id: { $in: user.followingIDs } } },
            { $skip: skip },
            { $limit: Number(limit) },
            { $sort: { verified: -1, createdAt: -1 } },
            {
                $project: {
                    username: 1,
                    info: 1,
                    verified: 1,
                    createdAt: 1
                }
            }
        ]);
        const followingCount = await User.countDocuments({ _id: { $in: user.followingIDs } });
        res.json({ users: following, usersCount: followingCount });
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
router.get('/followers/:username', async (req, res) => {
    const { username } = req.params;
    const { page = '1', limit = '10' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const followers = await User.aggregate([
            { $match: { _id: { $in: user.followersIDs } } },
            { $skip: skip },
            { $limit: Number(limit) },
            { $sort: { verified: -1, createdAt: -1 } },
            {
                $project: {
                    username: 1,
                    info: 1,
                    verified: 1,
                    createdAt: 1
                }
            }
        ]);
        const followersCount = await User.countDocuments({ _id: { $in: user.followersIDs } });
        res.json({ users: followers, usersCount: followersCount });
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
// Gets a user's pfp
router.get('/pfp/:username', async (req, res) => {
    const { username } = req.params;
    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (user.info.profilePicture === '') {
            return res.status(204).json({ message: 'No profile picture' });
        }
        const __filename = path.resolve();
        const imagePath = path.join(__filename, 'public', 'images', user.info.profilePicture);
        res.sendFile(imagePath);
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
// Gets a user's profile
router.get('/profile/:username', async (req, res) => {
    const { username } = req.params;
    const userId = req.userId;
    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // destructure user object
        const { _id, email, info, postsIDs, followingIDs, followersIDs, createdAt, verified } = user;
        // check if user is following the profile
        const objectId = toObjectId(userId);
        const isFollowing = user.followersIDs?.includes(objectId);
        // check if profile is the user's profile
        const isProfile = userId === user._id.toString();
        let toSend = { _id, username, email, info, postsIDs, followingIDs, followersIDs, createdAt, verified };
        if (!info.showEmail) {
            delete toSend.email;
        }
        res.json({ message: 'User found', user: toSend, isFollowing, isProfile });
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Internal server error' });
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
            return res.status(404).json({ message: 'User not found' });
        }
        // check if profile is the user's profile
        if (userId !== user._id.toString()) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        // update user info
        user.info.firstName = changed.info.firstName;
        user.info.lastName = changed.info.lastName;
        user.info.bio = changed.info.bio;
        user.username = changed.username;
        user.info.showEmail = changed.info.showEmail;
        await user.save();
        res.json({ message: 'User updated' });
        user.unreadNotifications.push('Profile updated.');
        await user.save();
        io.to(user._id.toString()).emit('newNotification', 'Profile updated.');
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
// Modifies a user's profile picture
router.patch('/profile/:username/uploadPfp', (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ message: 'Error uploading file' });
        }
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        const { filename } = req.file;
        const { username } = req.params;
        const userId = req.userId;
        try {
            const user = await User.findOne({ username });
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            // check if profile is the user's profile
            if (userId !== user._id.toString()) {
                return res.status(401).json({ message: 'Unauthorized' });
            }
            // update user profile picture
            user.info.profilePicture = filename;
            await user.save();
            res.json({ message: 'Profile picture updated', filename });
        }
        catch (err) {
            console.log(err);
            return res.status(500).json({ message: 'Internal server error' });
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
            return res.status(404).json({ message: 'User not found' });
        }
        const posts = await getPosts({ _id: { $in: user.postsIDs } }, { createdAt: -1 }, 0, 10, userId);
        res.json({ message: 'User found', posts });
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Internal server error' });
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
            return res.status(404).json({ message: 'User not found' });
        }
        // check if user is already following the user
        if (user.followingIDs?.includes(objToFollowId)) {
            return res.status(404).json({ message: 'User already followed' });
        }
        // add user to following list
        user.followingIDs?.push(objToFollowId);
        await user.save();
        // add user to followers list
        toFollow.followersIDs?.push(objUserId);
        await toFollow.save();
        res.json({ message: 'User followed', followerID: objUserId });
        toFollow.unreadNotifications.push(`@${user.username} started following you.`);
        await toFollow.save();
        io.to(toFollow._id.toString()).emit('newNotification', `@${user.username} started following you.`);
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Internal server error' });
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
            return res.status(404).json({ message: 'User not found' });
        }
        // check if user is following the user
        if (!user.followingIDs?.includes(objToUnfollowId)) {
            return res.json({ message: 'User not followed' });
        }
        // remove user from following list
        user.followingIDs = user.followingIDs?.filter(id => id.toString() !== objToUnfollowId.toString());
        await user.save();
        // remove user from followers list
        toUnfollow.followersIDs = toUnfollow.followersIDs?.filter(id => id.toString() !== objUserId.toString());
        await toUnfollow.save();
        res.json({ message: 'User unfollowed', followerID: objUserId });
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Internal server error' });
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
            { $sort: { username: -1 } },
            {
                $addFields: {
                    followersCount: { $size: "$followersIDs" }
                }
            },
            { $sort: { followersCount: -1 } },
            { $limit: Number(limit) },
            { $skip: (Number(page) - 1) * Number(limit) },
            {
                $project: {
                    email: { $cond: [{ $eq: ['$info.showEmail', true] }, '$email', null] },
                    username: 1,
                    info: 1,
                    followersCount: 1,
                    verified: 1
                }
            }
        ]);
        const usersCount = await User.countDocuments({
            $or: [
                { username: regex },
                { 'info.firstName': regex },
                { 'info.lastName': regex }
            ]
        });
        res.json({ users, usersCount });
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
// Suggestions for users to follow
router.get('/suggestions', async (req, res) => {
    const userId = req.userId;
    const { limit = '10', page = '1' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    try {
        const user = await User.findById(userId);
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        const users = await User.aggregate([
            {
                $match: {
                    _id: { $ne: toObjectId(userId), $nin: user.followingIDs }
                }
            },
            { $limit: Number(limit) },
            { $skip: skip },
            { $sort: { verified: -1 } },
            {
                $addFields: {
                    followersCount: { $size: "$followersIDs" }
                }
            },
            { $sort: { followersCount: -1, verified: -1 } },
            {
                $project: {
                    email: { $cond: [{ $eq: ['$info.showEmail', true] }, '$email', null] },
                    username: 1,
                    info: 1,
                    followersCount: 1,
                    verified: 1
                }
            }
        ]);
        const usersCount = await User.countDocuments({
            _id: { $ne: toObjectId(userId) }
        });
        res.json({ users, usersCount, message: 'Users found' });
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
router.get('/unreadNotifications/:username', async (req, res) => {
    const { username } = req.params;
    try {
        const user = await User.findOne({ username });
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        res.json({ notifications: user.unreadNotifications });
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
router.patch('/notifications/:username', async (req, res) => {
    const { username } = req.params;
    try {
        const user = await User.findOne({ username });
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        user.unreadNotifications = [];
        await user.save();
        res.sendStatus(200);
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
export default router;
