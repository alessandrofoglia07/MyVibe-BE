import jwt from 'jsonwebtoken';
/** Verify access token
 * - Use case: for protected routes that require a valid access token
 */
const verifyAccessToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token)
        return res.status(401).json({ message: 'Access token not found' });
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) {
            console.log(err);
            return res.status(401).json({ message: 'Invalid access token' });
        }
        else {
            req.userId = user.userId;
            next();
        }
    });
};
export default verifyAccessToken;
