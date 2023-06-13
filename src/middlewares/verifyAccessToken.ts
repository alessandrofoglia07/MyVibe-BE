import { NextFunction, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../types.js';

/** Verify access token
 * - Use case: for protected routes that require a valid access token
 */
const verifyAccessToken = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Access token not found' });
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!, (err: any, user: any) => {
        if (err) {
            console.log(err);
            return res.status(401).json({ message: 'Invalid access token' });
        } else {
            req.userId = user.userId;
            next();
        }
    });
};

export default verifyAccessToken;