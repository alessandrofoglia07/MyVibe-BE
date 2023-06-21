import BannedID from "../models/bannedIDs.js";
import { toObjectId } from "../types.js";
const checkBanned = async (req, res, next) => {
    const userId = req.userId;
    if (!userId)
        return res.status(401).json({ message: "Unauthorized" });
    try {
        const bannedID = await BannedID.findOne({ userId: toObjectId(userId) });
        if (bannedID)
            return res.sendStatus(403);
        next();
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
export default checkBanned;
