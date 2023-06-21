import { Router, Request, Response } from 'express';
import sendEmail from '../utils/sendEmail.js';
import User from '../models/user.js';
import Post from '../models/post.js';
import Comment from '../models/comment.js';
import { v4 as uuidv4 } from 'uuid';
import checkAdmin from '../middlewares/checkAdmin.js';
import BannedID from '../models/bannedIDs.js';

const router = Router();

// Admin middleware
router.use(checkAdmin);

// Starts the verification process for a user
router.post('/startVerification', async (req: Request, res: Response) => {
    const userToVerify = req.body.userToVerify;

    try {
        const user = await User.findOne({ username: userToVerify });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user!.verified) {
            return res.status(400).json({ message: 'User already verified' });
        }

        // Generate a verification code
        const verificationCode = uuidv4();

        // Update the user's verification code
        user.verificationCode = verificationCode;
        await user.save();

        // TODO (in future): Change this to a more secure method
        sendEmail(user.email, 'MyVibe - Verify your account', `Congratulations! Your account has been selected by an admin to be shown as verified on MyVibe! Click on this link to verify your account: http://localhost:3000/verifyAccount/${user.verificationCode}`);

        return res.status(200).json({ message: 'Process started successfully' });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.delete('/resetPostsAndComments', async (req: Request, res: Response) => {
    try {
        await User.updateMany({}, { postsIDs: [] });
        await Post.deleteMany({});
        await Comment.deleteMany({});

        return res.json({ message: 'Posts and comments reset successfully' });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/bannedIDs', async (req: Request, res: Response) => {
    try {
        const bannedIDs = await BannedID.find({});

        return res.json(bannedIDs);
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/ban/:userId', async (req: Request, res: Response) => {
    const { userId } = req.params;

    try {
        const bannedID = new BannedID({ userId });
        await bannedID.save();

        return res.json({ message: 'User banned successfully' });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;