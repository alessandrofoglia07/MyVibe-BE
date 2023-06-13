import { Response, Router } from 'express';
import User from '../models/user.js';
import verifyAccessToken from '../middlewares/verifyAccessToken.js';
import { AuthRequest, toObjectId, IUserChanged } from '../types.js';
import { upload } from '../index.js';
import path from 'path';
import getPosts from '../utils/getPostsPipeline.js';

const router = Router();

router.use(verifyAccessToken);

// Gets all people user follows
router.get('/following', async (req: AuthRequest, res: Response) => {
    const userId = req.userId;

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const following: any[] = await User.find({ _id: { $in: user.followingIDs } });
        const usernames = following.map(user => user.username);

        res.json({ usernames });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

// Gets a user's pfp
router.get('/pfp/:username', async (req: AuthRequest, res: Response) => {
    const { username } = req.params;

    try {
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.info.profilePicture === '') {
            return res.json({ message: 'No profile picture' });
        }

        const __filename = path.resolve();
        const imagePath = path.join(__filename, 'public', 'images', user.info.profilePicture);

        res.sendFile(imagePath);
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

// Gets a user's profile
router.get('/profile/:username', async (req: AuthRequest, res: Response) => {
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
        const objectId = toObjectId(userId!);
        const isFollowing = user.followersIDs?.includes(objectId);

        // check if profile is the user's profile
        const isProfile = userId === user._id.toString();

        res.json({ message: 'User found', user: { _id, username, email, info, postsIDs, followingIDs, followersIDs, createdAt, verified }, isFollowing, isProfile });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});



// Modifies a user's profile
router.patch('/profile/:username', async (req: AuthRequest, res: Response) => {
    const { username } = req.params;
    const userId = req.userId;
    const changed: IUserChanged = req.body.user;

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
        await user.save();

        res.json({ message: 'User updated' });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

// Modifies a user's profile picture
router.patch('/profile/:username/uploadPfp', (req: AuthRequest, res: Response) => {
    upload(req, res, async (err: any) => {
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
        } catch (err) {
            console.log(err);
            return res.status(500).json({ message: 'Internal server error' });
        }
    });
});

// Gets a user's posts
router.get('/posts/:username', async (req: AuthRequest, res: Response) => {
    const { username } = req.params;
    const userId = req.userId;

    try {
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const posts = await getPosts({ _id: { $in: user.postsIDs } }, { createdAt: -1 }, 0, 10, userId!);

        res.json({ message: 'User found', posts });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Internal server error' });
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
            return res.status(404).json({ message: 'User not found' });
        }

        // check if user is already following the user
        if (user.followingIDs?.includes(objToFollowId)) {
            return res.json({ message: 'User already followed' });
        }

        // add user to following list
        user.followingIDs?.push(objToFollowId);
        await user.save();

        // add user to followers list
        toFollow.followersIDs?.push(objUserId);
        await toFollow.save();

        res.json({ message: 'User followed', followerID: objUserId });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Internal server error' });
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
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

// Searches for users
router.get('/search', async (req: AuthRequest, res: Response) => {
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
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

// Suggestions for users to follow
router.get('/suggestions', async (req: AuthRequest, res: Response) => {
    const userId = req.userId;
    const { limit = '0', page = '1' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    try {
        const users = await User.aggregate([
            {
                $match: {
                    _id: { $ne: toObjectId(userId!) }
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
            { $sort: { followersCount: -1 } }
        ]);

        const usersCount = await User.countDocuments({
            _id: { $ne: toObjectId(userId!) }
        });

        res.status(200).json({ users, usersCount, message: 'Users found' });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;