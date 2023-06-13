import jwt from 'jsonwebtoken';
/** Generate access token
 * - Use case: after a user has successfully authenticated with valid credentials
 */
export const generateAccessToken = async (user) => {
    const token = jwt.sign({ userId: user._id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
    return token;
};
/** Generate a refresh for a user and save it to the database
 * - Use case: after a user has successfully authenticated with valid credentials
 */
export const generateRefreshToken = async (user) => {
    const refreshToken = jwt.sign({ userId: user._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '30 days' });
    return refreshToken;
};
