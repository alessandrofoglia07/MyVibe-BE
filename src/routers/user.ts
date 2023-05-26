import express, { Response } from 'express';
import cors from 'cors';
import User from '../models/user.js';
import { AuthRequest, verifyAccessToken } from './auth.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

router.use(cors());
router.use(express.json());
router.use(verifyAccessToken);

// Gets a user's profile
router.get('/:username', async (req: AuthRequest, res: Response) => {
    const { username } = req.params;

    try {
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(404).send({ message: 'User not found' });
        }

        // destructure user object
        const { _id, email, info, postsIDs, followingIDs, followersIDs } = user;

        res.send({ _id, username, email, info, postsIDs, followingIDs, followersIDs, message: 'User found' });
    } catch (err) {
        console.log(err);
    }
});

// Gets all people user follows
router.get('/following', async (req: AuthRequest, res: Response) => {
    const userId = req.userId;

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).send({ message: 'User not found' });
        }

        const following: any[] = await User.find({ _id: { $in: user.followingIDs } });
        const usernames = following.map(user => user.username);

        res.send({ usernames });
    } catch (err) {
        console.log(err);
    }
});

export default router;