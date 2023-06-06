import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRouter from './routers/auth.js';
import postRouter from './routers/post.js';
import userRouter from './routers/user.js';

dotenv.config();

const app = express();

app.use(cors(
    {
        origin: 'http://localhost:3000',
    }
));
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/posts', postRouter);
app.use('/api/users', userRouter);

const PORT = process.env.PORT || 5000;
const URI = process.env.MONGODB_URI || '';

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