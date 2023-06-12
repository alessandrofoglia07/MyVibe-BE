import express, { Router, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { sendEmail } from '../index.js';
import User from '../models/user.js';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const router = Router();

router.use(cors());
router.use(express.json());

const checkAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (req.body.adminPassword === process.env.ADMIN_SECRET_KEY) {
        next();
    } else {
        return res.status(401).send('Unauthorized');
    }
};

// Admin middleware
router.use(checkAdmin);

// Starts the verification process for a user
router.post('/startVerification', checkAdmin, async (req: Request, res: Response) => {
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

export default router;