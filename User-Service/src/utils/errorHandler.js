const BaseError = require('../errors/base.error');
const { StatusCodes } = require('http-status-codes');
const logger = require('../config/logger.config');

function errorHandler(err, req, res, next) {
    logger.error(err);

    if (err instanceof BaseError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            error: err.details,
            data: {}
        });
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        return res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: 'Validation failed',
            error: err.message,
            data: {}
        });
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        return res.status(StatusCodes.CONFLICT).json({
            success: false,
            message: `${field} already exists`,
            error: err.message,
            data: {}
        });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(StatusCodes.UNAUTHORIZED).json({
            success: false,
            message: 'Invalid token',
            error: err.message,
            data: {}
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(StatusCodes.UNAUTHORIZED).json({
            success: false,
            message: 'Token expired',
            error: err.message,
            data: {}
        });
    }

    // Default error
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Something went wrong',
        error: err.message,
        data: {}
    });
}

module.exports = errorHandler;
