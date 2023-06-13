import { NextFunction, Request, Response } from 'express';

/**
 * Checks if the admin password is correct
 */
const checkAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (req.body.adminPassword === process.env.ADMIN_SECRET_KEY) {
        next();
    } else {
        return res.status(401).send('Unauthorized');
    }
};

export default checkAdmin;