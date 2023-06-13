import { Router } from 'express';
import sendEmail from '../utils/sendEmail.js';
import User from '../models/user.js';
import { v4 as uuidv4 } from 'uuid';
import checkAdmin from '../middlewares/checkAdmin.js';
const router = Router();
// Admin middleware
router.use(checkAdmin);
// Starts the verification process for a user
router.post('/startVerification', async (req, res) => {
    const userToVerify = req.body.userToVerify;
    try {
        const user = await User.findOne({ username: userToVerify });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (user.verified) {
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
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});
export default router;
