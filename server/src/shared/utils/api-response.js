export const sendSuccess = (response, options) => {
    const { data, message, meta, statusCode = 200 } = options;
    return response.status(statusCode).json({
        success: true,
        message,
        data,
        meta,
    });
};
