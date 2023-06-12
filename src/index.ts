import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRouter from './routers/auth.js';
import postRouter from './routers/post.js';
import userRouter from './routers/user.js';
import adminRouter from './routers/admin.js';
import path from 'path';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';

dotenv.config();

const app = express();

// Cors config
app.use(cors(
    {
        origin: 'http://localhost:3000',
    }
));
app.use(express.json());

// Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/posts', postRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/admin', adminRouter);

// Multer storage for uploaded images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, '/public/images/');
    },
    filename: (req, file, cb) => {
        const uniqueFilename = `${uuidv4()}-${file.originalname}`;
        cb(null, uniqueFilename);
    }
});

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
export const sendEmail = (recipient: string, subject: string, text: string) => {
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

// File upload middleware
export const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const fileTypes = /jpeg|jpg|png|gif/;
        const mimetype = fileTypes.test(file.mimetype);
        const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        };
        cb(new Error('Error: Images only'));
    }
}).single('pfp');

const PORT = process.env.PORT || 5000;
const URI = process.env.MONGODB_URI || '';

// mongodb connection
const connection = async () => {
    try {
        await mongoose.connect(URI);
        console.clear();
        console.log('\x1b[36m', '-- Connected to MongoDB');
        app.listen(PORT, () => console.log('\x1b[36m', `-- Server running on port ${PORT}`));
    } catch (err) {
        console.log(err);
    }
};
await connection();

app.all('*', (req, res) => {
    res.status(404).json({ message: '404 Not Found' });
});