import { Request, Response, NextFunction } from 'express';

/** Check if username, email and password are valid */
const checkCredentials = (req: Request, res: Response, next: NextFunction) => {

    const emailRegex = /(?: [a - z0 - 9!#$ %& '*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&' * +/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;

    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ message: 'All fields required' });
    if (username.length < 3 || username.length > 20) return res.status(400).json({ message: 'Username must be 3-20 characters long' });
    if (email.length < 5 || email.length > 50) return res.status(400).json({ message: 'Email must be 5-50 characters long' });
    if (password.length < 6 || password.length > 16) return res.status(400).json({ message: 'Password must be 6-16 characters long' });
    if (username.includes(' ')) return res.status(400).json({ message: 'Username cannot contain spaces' });
    if (email.includes(' ')) return res.status(400).json({ message: 'Email cannot contain spaces' });
    if (password.includes(' ')) return res.status(400).json({ message: 'Password cannot contain spaces' });

    if (!emailRegex.test(email)) return res.status(400).json({ message: 'Invalid email' });

    next();
};

export default checkCredentials;