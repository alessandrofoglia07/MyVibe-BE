const getPaginated = (req, res, next) => {
    const { limit, page } = req.query;
    req.pagination = {
        limit: Number(limit),
        page: Number(page),
        skip: (Number(page) - 1) * Number(limit),
    };
    next();
};
export default getPaginated;
