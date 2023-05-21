import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import User, { IUserDocument } from './models/user.js';
import VerificationCode from './models/verificationCode.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

const router = express.Router();

router.use(cors());
router.use(express.json());

// Nodemailer setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.DEFAULT_EMAIL,
        pass: process.env.DEFAULT_PASSWORD
    }
});

/**Sends an email with nodemailer
 * @param recipient - the email address of the recipient
 * @param subject - the subject of the email
 * @param text - the text of the email
 * @returns void
 */
const sendEmail = (recipient: string, subject: string, text: string) => {
    const mailOptions = {
        from: process.env.DEFAULT_EMAIL,
        to: recipient,
        subject: subject,
        text: text
    };

    transporter.sendMail(mailOptions, (err: any, info: any) => {
        if (err) {
            console.log(err);
        }
    });
};

/** Generate access token
 * - Use case: after a user has successfully authenticated with valid credentials
 */
const generateAccessToken = async (user: IUserDocument) => {
    const token = jwt.sign({ userId: user._id }, process.env.ACCESS_TOKEN_SECRET as string, { expiresIn: '15m' });
    return token;
};

/** Generate a refresh for a user and save it to the database
 * - Use case: after a user has successfully authenticated with valid credentials
 */
const generateRefreshToken = async (user: IUserDocument) => {
    const refreshToken = jwt.sign({ userId: user._id }, process.env.REFRESH_TOKEN_SECRET as string, { expiresIn: '30 days' });
    return refreshToken;
};

export interface AuthRequest extends Request {
    userId?: string;
}

/** Verify access token
 * - Use case: for protected routes that require a valid access token
 */
export const verifyAccessToken = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).send({ message: 'Access token not found' });
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!, (err: any, user: any) => {
        if (err) {
            console.log(err);
            return res.send({ message: 'Invalid access token' });
        } else {
            req.userId = user.userId;
            next();
        }
    });
};


// Send authentication code to user's email
/* req format:
{
    username: string,
    email: string,
    password: string
}
*/
router.post('/send-code', async (req: Request, res: Response) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.send({ message: 'All fields required' });

    try {
        // Check if email is already registered
        const userByEmail = await User.findOne({ email: email });
        if (userByEmail) return res.send({ message: 'Email already registered' });

        // Check if username is already taken
        const userByUsername = await User.findOne({ username: username });
        if (userByUsername) return res.send({ message: 'Username already taken' });

        // Check if password is valid
        const passRegex = /^(?=.*\d).{6,16}$/;
        if (!passRegex.test(password)) return res.send({ message: 'Password must be 6-16 characters long, and contain at least a letter and a number' });

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

        res.status(200).send({ message: 'Verification code sent' });
    } catch (err) {
        console.log(err);
        return res.status(500).send({ message: 'Internal server error' });
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
router.post('/verify-code', async (req: Request, res: Response) => {
    const { username, email, password, code } = req.body;
    if (!username || !email || !password || !code) return res.send({ message: 'All fields required' });

    try {

        // Check if code is valid
        const document = await VerificationCode.findOne({ email: email });
        if (!document) return res.send({ message: 'Invalid verification code' });
        if (document.code.toString() !== code) return res.send({ message: 'Invalid verification code' });

        document.deleteOne();

        const hashedPassword = await bcrypt.hash(password, 10);
        const user: IUserDocument = new User({
            username,
            email,
            password: hashedPassword,
            info: {
                profilePicture: '',
            },
            postsIDs: []
        });
        await user.save();
        res.status(200).send({ message: 'User created' });

    } catch (err) {
        console.log(err);
        res.status(500).send({ message: 'Internal server error' });
    }
});

// Login
/* req format:
{
    email: string,
    password: string
}
*/
router.post('/login', async (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) return res.send({ message: 'Email and password required' });

    try {
        const user: IUserDocument | null = await User.findOne({ email: email });

        if (!user) return res.send({ message: 'Invalid email or password' });

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return res.send({ message: 'Invalid email or password' });

        const accessToken = await generateAccessToken(user);
        const refreshToken = await generateRefreshToken(user);

        res.status(200).send({ accessToken, refreshToken, userId: user._id, email: email, message: 'Login successful' });
    } catch (err) {
        console.log(err);
        res.status(500).send({ message: 'Internal server error' });
    }
});

// Get new access token using refresh token
// To use: When could not get access to protected route, send refresh token to this route to get new access token
router.post('/refresh-token', async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    try {
        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET as string, async (err: any, decoded: any) => {
            if (err) {
                console.log(err);
                return res.status(403).send({ message: 'Invalid refresh token' });
            }

            const userId = decoded.userId;
            const user = await User.findById(userId);

            if (!user) return res.status(403).send({ message: 'Invalid refresh token' });

            const accessToken = await generateAccessToken(user);
            res.send({ accessToken });
        });
    } catch (err) {
        console.log(err);
        res.status(500).send({ message: 'Internal server error' });
    }
});

router.post('/forgotPassword', async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) return res.send({ message: 'Email not found' });

    try {
        const user = await User.findOne({ email: email });

        if (!user) return res.send({ message: 'Email not found' });

        user.forgotPassword = true;
        await user.save();

        sendEmail(email, 'MyVibe - Reset Password', `Click this link to reset your password: http://localhost:3000/resetPassword/${user._id}`);
        res.send({ message: 'Email sent' });
    } catch (err) {
        console.log(err);
    }
});

router.get('/checkResetPassword/:userId', async (req: Request, res: Response) => {
    const { userId } = req.params;

    try {
        const user = await User.findById(userId);

        if (!user) return res.send({ forgotPassword: false });
        if (!user.forgotPassword) return res.send({ forgotPassword: false });

        user.forgotPassword = false;
        await user.save();

        res.send({ forgotPassword: true });
    } catch (err) {
        console.log(err);
    }
});

router.post('/changePassword', async (req: Request, res: Response) => {
    const { id, newPassword } = req.body;

    if (!id || !newPassword) return res.send({ message: 'All fields required' });

    try {
        const user = await User.findById(id);

        if (!user) return res.send({ message: 'Invalid user' });

        const hash = await bcrypt.hash(newPassword, 10);
        user.password = hash;
        user.forgotPassword = false;
        await user.save();

        res.send({ message: 'Password changed' });
    } catch (err) {
        console.log(err);
    }
});

export default router;