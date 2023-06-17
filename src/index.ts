import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import authRouter from './routers/auth.js';
import postRouter from './routers/post.js';
import userRouter from './routers/user.js';
import adminRouter from './routers/admin.js';
import { notificationSocket } from './sockets/notificationSocket.js';
import path from 'path';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Socket.io setup
export const io = new Server(server, {
    cors: {
        origin: 'http://localhost:3000',
    }
});

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

// Socket.io
notificationSocket(io);

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
export const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.DEFAULT_EMAIL,
        pass: process.env.DEFAULT_PASSWORD
    }
});

// File upload with multer
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
        server.listen(PORT, () => console.log('\x1b[36m', `-- Server running on port ${PORT}`));
    } catch (err) {
        console.log(err);
    }
};
await connection();

app.all('*', (req, res) => {
    res.status(404).json({ message: '404 Not Found' });
});