import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRouter from './usersAuth.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// IMPORTANT: THIS IS A TEST. IT IS NOT FINISHED.
app.use('/auth', authRouter);

const PORT = process.env.PORT || 5000;
const URI = process.env.MONGODB_URI || '';

const connection = async () => {
    try {
        await mongoose.connect(URI);
        console.log('Connected to MongoDB');
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    } catch (err) {
        console.log(err);
    }
};
connection();

