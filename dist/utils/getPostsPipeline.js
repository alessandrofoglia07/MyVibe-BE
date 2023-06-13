import Post from '../models/post.js';
/**
 * Gets posts from the database
 * @param match Filter query
 * @param sort Ex: { createdAt: -1 }
 * @param skip Number of posts to skip
 * @param limit Number of posts to return
 * @param userId User's _id to check if they liked the post
 * @returns Posts
 */
const getPosts = async (match, sort, skip, limit, userId) => {
    return await Post.aggregate([
        { $match: match },
        { $skip: skip },
        { $limit: limit },
        {
            $lookup: {
                from: 'users',
                localField: 'author',
                foreignField: '_id',
                as: 'authorData',
            },
        },
        {
            $addFields: {
                liked: { $in: [userId, "$likes"] },
                numLikes: { $size: "$likes" },
                authorVerified: { $arrayElemAt: ["$authorData.verified", 0] },
            }
        },
        { $sort: sort }
    ]);
};
export default getPosts;
