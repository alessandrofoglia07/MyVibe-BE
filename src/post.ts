import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { verifyAccessToken } from './auth.js';

dotenv.config();

const router = express.Router();

router.use(cors());
router.use(express.json());
router.use(verifyAccessToken);

export default router;