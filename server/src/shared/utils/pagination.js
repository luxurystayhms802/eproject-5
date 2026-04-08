export const getPagination = (query) => {
    const page = Math.max(1, Number(query.page ?? 1) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit ?? 12) || 12));
    return {
        page,
        limit,
        skip: (page - 1) * limit,
    };
};
export const buildPaginationMeta = (options, total) => ({
    page: options.page,
    limit: options.limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / options.limit)),
});
