import jwt from 'jsonwebtoken';
import { IUserDocument } from '../types.js';

/** Generate access token (expires in 15 minutes)
 * - Use case: after a user has successfully authenticated with valid credentials
 */
export const generateAccessToken = async (user: IUserDocument) => {
    const token = jwt.sign({ userId: user._id }, process.env.ACCESS_TOKEN_SECRET as string, { expiresIn: '15m' });
    return token;
};

/** Generate a refresh for a user and save it to the database (expires in 30 days)
 * - Use case: after a user has successfully authenticated with valid credentials
 */
export const generateRefreshToken = async (user: IUserDocument) => {
    const refreshToken = jwt.sign({ userId: user._id }, process.env.REFRESH_TOKEN_SECRET as string, { expiresIn: '30 days' });
    return refreshToken;
};