import { NextResponse } from 'next/server';
import { ApiResponse, ApiError, ValidationError } from './types/api';

/**
 * Creates a standard success response
 */
export function successResponse<T>(data: T, message?: string, status: number = 200) {
    const response: ApiResponse<T> = {
        success: true,
        data,
        message,
    };
    return NextResponse.json(response, { status });
}

/**
 * Creates a standard error response
 */
export function errorResponse(
    message: string,
    code: string = 'INTERNAL_ERROR',
    status: number = 500,
    validationErrors?: ValidationError[],
    details?: Record<string, any>
) {
    const error: ApiError = {
        code,
        message,
        validationErrors,
        details,
    };
    const response: ApiResponse<null> = {
        success: false,
        error,
    };
    return NextResponse.json(response, { status });
}

/**
 * Common error responses
 */
export const ApiErrors = {
    unauthorized: (message: string = 'Unauthorized') =>
        errorResponse(message, 'UNAUTHORIZED', 401),

    forbidden: (message: string = 'Forbidden') =>
        errorResponse(message, 'FORBIDDEN', 403),

    notFound: (message: string = 'Resource not found') =>
        errorResponse(message, 'NOT_FOUND', 404),

    badRequest: (message: string = 'Bad request', validationErrors?: ValidationError[]) =>
        errorResponse(message, 'BAD_REQUEST', 400, validationErrors),

    internalError: (message: string = 'An unexpected error occurred') =>
        errorResponse(message, 'INTERNAL_ERROR', 500),
};
