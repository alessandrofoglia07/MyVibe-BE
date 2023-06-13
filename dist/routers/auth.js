import { Router } from 'express';
import User from '../models/user.js';
import VerificationCode from '../models/verificationCode.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import sendEmail from '../utils/sendEmail.js';
import checkCredentials from '../middlewares/checkCredentials.js';
import { generateAccessToken, generateRefreshToken } from '../utils/authentication.js';
const router = Router();
// Send authentication code to user's email
/* req format:
{
    username: string,
    email: string,
    password: string
}
*/
router.post('/send-code', checkCredentials, async (req, res) => {
    const { username, email, password } = req.body;
    try {
        // Check if email is already registered
        const userByEmail = await User.findOne({ email: email });
        if (userByEmail)
            return res.status(409).json({ message: 'Email already registered' });
        // Check if username is already taken
        const userByUsername = await User.findOne({ username: username });
        if (userByUsername)
            return res.status(409).json({ message: 'Username already taken' });
        // Check if password is valid
        const passRegex = /^(?=.*\d).{6,16}$/;
        if (!passRegex.test(password))
            return res.status(400).json({ message: 'Password must be 6-16 characters long, and contain at least a letter and a number' });
        // Generate and send verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000); // Generate 6-digit code
        sendEmail(email, 'MyVibe - Verification Code', `Your verification code is: ${verificationCode}`);
        await VerificationCode.deleteMany({ email: email });
        const verificationCodeDocument = new VerificationCode({
            username,
            email,
            code: verificationCode
        });
        await verificationCodeDocument.save();
        res.status(200).json({ message: 'Verification code sent' });
    }
    catch (err) {
        console.log(err);
        return res.sendStatus(500);
    }
});
// Verify authentication code and sign up
/* req format:
{
    username: string,
    email: string,
    password: string,
    code: string
}
*/
router.post('/verify-code', checkCredentials, async (req, res) => {
    const { username, email, password, code } = req.body;
    try {
        // Check if code is valid
        const document = await VerificationCode.findOne({ email: email });
        if (!document)
            return res.status(400).json({ message: 'Invalid verification code' });
        if (document.code.toString() !== code)
            return res.status(400).json({ message: 'Invalid verification code' });
        document.deleteOne();
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            username,
            email,
            password: hashedPassword,
            info: {},
            postsIDs: []
        });
        await user.save();
        res.status(201).json({ message: 'User created' });
    }
    catch (err) {
        console.log(err);
        return res.sendStatus(500);
    }
});
// Login
/* req format:
{
    email: string,
    password: string
}
*/
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password)
        return res.status(400).json({ message: 'Email and password required' });
    try {
        const user = await User.findOne({ email: email });
        if (!user)
            return res.status(401).json({ message: 'Invalid email or password' });
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid)
            return res.status(401).json({ message: 'Invalid email or password' });
        const accessToken = await generateAccessToken(user);
        const refreshToken = await generateRefreshToken(user);
        res.status(200).json({ accessToken, refreshToken, userId: user._id, email: email, username: user.username, verified: user.verified, message: 'Login successful' });
    }
    catch (err) {
        console.log(err);
        return res.sendStatus(500);
    }
});
// Get new access token using refresh token
// To use: When could not get access to protected route, send refresh token to this route to get new access token
router.post('/refresh-token', async (req, res) => {
    const { refreshToken } = req.body;
    try {
        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, async (err, decoded) => {
            if (err) {
                console.log(err);
                return res.status(403).json({ message: 'Invalid refresh token' });
            }
            const userId = decoded.userId;
            const user = await User.findById(userId);
            if (!user)
                return res.status(403).json({ message: 'Invalid refresh token' });
            const accessToken = await generateAccessToken(user);
            res.json({ accessToken, message: 'Token refreshed' });
        });
    }
    catch (err) {
        console.log(err);
        return res.sendStatus(500);
    }
});
router.post('/forgotPassword', async (req, res) => {
    const { email } = req.body;
    if (!email)
        return res.status(400).json({ message: 'Email not found' });
    try {
        const user = await User.findOne({ email: email });
        if (!user)
            return res.status(404).json({ message: 'Email not found' });
        user.forgotPassword = true;
        await user.save();
        sendEmail(email, 'MyVibe - Reset Password', `Click this link to reset your password: http://localhost:3000/resetPassword/${user._id}`);
        res.json({ message: 'Email sent' });
    }
    catch (err) {
        console.log(err);
        return res.sendStatus(500);
    }
});
router.get('/checkResetPassword/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const user = await User.findById(userId);
        if (!user)
            return res.json({ forgotPassword: false });
        if (!user.forgotPassword)
            return res.json({ forgotPassword: false });
        user.forgotPassword = false;
        await user.save();
        res.json({ forgotPassword: true });
    }
    catch (err) {
        console.log(err);
        return res.sendStatus(500);
    }
});
router.post('/changePassword', async (req, res) => {
    const { id, newPassword } = req.body;
    if (!id || !newPassword)
        return res.status(400).json({ message: 'All fields required' });
    try {
        const user = await User.findById(id);
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();
        res.json({ message: 'Password changed successfully' });
    }
    catch (err) {
        console.log(err);
        return res.sendStatus(500);
    }
});
router.post('/completeVerification/:verificationCode', async (req, res) => {
    const { verificationCode } = req.params;
    try {
        const user = await User.findOne({ verificationCode });
        if (!user)
            return res.status(404).json({ message: 'User not found.' });
        user.verified = true;
        user.verificationCode = undefined;
        await user.save();
        res.status(200).json({ message: 'Verification completed.' });
    }
    catch (err) {
        console.log(err);
        return res.sendStatus(500).json({ message: 'Internal server error.' });
    }
});
export default router;
