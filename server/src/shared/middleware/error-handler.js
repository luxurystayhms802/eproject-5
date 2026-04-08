import { MongoServerError } from 'mongodb';
import { Error as MongooseError } from 'mongoose';
import { ZodError } from 'zod';
import { AppError } from '../utils/app-error.js';
export const errorHandler = (error, _request, response, _next) => {
    if (error instanceof ZodError) {
        return response.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: error.flatten(),
        });
    }
    if (error instanceof AppError) {
        return response.status(error.statusCode).json({
            success: false,
            message: error.message,
        });
    }
    if (error instanceof MongoServerError && error.code === 11000) {
        const field = Object.keys(error.keyPattern ?? {})[0] ?? 'field';
        return response.status(409).json({
            success: false,
            message: `${field} already exists`,
        });
    }
    if (error instanceof MongooseError.CastError) {
        return response.status(400).json({
            success: false,
            message: 'Invalid resource identifier',
        });
    }
    if (error.name === 'TokenExpiredError') {
        return response.status(401).json({
            success: false,
            message: 'Authentication token has expired',
        });
    }
    if (error.name === 'JsonWebTokenError' || error.name === 'NotBeforeError') {
        return response.status(401).json({
            success: false,
            message: 'Invalid authentication token',
        });
    }
    if (error.statusCode && error.statusCode >= 400 && error.statusCode < 600) {
        return response.status(error.statusCode).json({
            success: false,
            message: error.message,
        });
    }
    return response.status(500).json({
        success: false,
        message: error.message || 'Internal server error',
    });
};
