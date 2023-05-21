import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRouter, { verifyAccessToken } from './auth.js';
import postRouter from './post.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/auth', authRouter);
app.use('/api/posts', postRouter);

const PORT = process.env.PORT || 5000;
const URI = process.env.MONGODB_URI || '';

const connection = async () => {
    try {
        await mongoose.connect(URI);
        console.log('\x1b[36m', '-- Connected to MongoDB');
        app.listen(PORT, () => console.log('\x1b[36m', `-- Server running on port ${PORT}`));
    } catch (err) {
        console.log(err);
    }
};
await connection();

