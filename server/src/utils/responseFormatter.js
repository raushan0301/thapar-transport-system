/**
 * Standard success response
 */
const successResponse = (res, data, message = 'Success', statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data
    });
};

/**
 * Standard error response
 */
const errorResponse = (res, message, statusCode = 500, errors = null) => {
    return res.status(statusCode).json({
        success: false,
        error: {
            message,
            statusCode,
            ...(errors && { errors })
        }
    });
};

/**
 * Paginated response
 */
const paginatedResponse = (res, data, page, limit, total, message = 'Success') => {
    return res.status(200).json({
        success: true,
        message,
        data,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / limit)
        }
    });
};

module.exports = {
    successResponse,
    errorResponse,
    paginatedResponse
};
