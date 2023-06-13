/**
 * Checks if the admin password is correct
 */
const checkAdmin = (req, res, next) => {
    if (req.body.adminPassword === process.env.ADMIN_SECRET_KEY) {
        next();
    }
    else {
        return res.status(401).send('Unauthorized');
    }
};
export default checkAdmin;
