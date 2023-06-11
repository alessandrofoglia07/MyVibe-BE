import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRouter from './routers/auth.js';
import postRouter from './routers/post.js';
import userRouter from './routers/user.js';
import path from 'path';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
dotenv.config();
const app = express();
// Cors config
app.use(cors({
    origin: 'http://localhost:3000',
}));
app.use(express.json());
// Routes
app.use('/api/auth', authRouter);
app.use('/api/posts', postRouter);
app.use('/api/users', userRouter);
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
// File upload middleware
export const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const fileTypes = /jpeg|jpg|png|gif/;
        const mimetype = fileTypes.test(file.mimetype);
        const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        ;
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
    }
    catch (err) {
        console.log(err);
    }
};
await connection();
app.all('*', (req, res) => {
    res.status(404).json({ message: '404 Not Found' });
});
