import mongoose from 'mongoose';
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
const getPosts = async (match: mongoose.FilterQuery<any>, sort: Record<string, 1 | -1 | mongoose.Expression.Meta>, skip: number, limit: number, userId: string): Promise<any> => {
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
        {
            $project: {
                authorData: 0,
            }
        },
        { $sort: sort }
    ]);
};

export default getPosts;