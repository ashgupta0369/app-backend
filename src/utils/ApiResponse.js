class ApiResponse {
    constructor(statusCode, data, message) {
        this.statusCode = statusCode;
        this.success = statusCode >= 200 && statusCode < 300;
        this.message = message;
        this.data = data;
    }
}

// General response utility functions
const sendResponse = (res, statusCode, message, data = null) => {
    return res.status(statusCode).json({
        statusCode,
        success: statusCode >= 200 && statusCode < 300,
        message,
        data
    });
};

// Success response functions
const sendSuccess = (res, message = 'Success', data = null, statusCode = 200) => {
    return sendResponse(res, statusCode, message, data);
};

const sendCreated = (res, message = 'Successfully created', data = null) => {
    return sendResponse(res, 201, message, data);
};

const sendUpdated = (res, message = 'Successfully updated', data = null) => {
    return sendResponse(res, 200, message, data);
};

const sendDeleted = (res, message = 'Successfully deleted', data = null) => {
    return sendResponse(res, 200, message, data);
};

// Error response functions
const sendError = (res, statusCode, message, data = null) => {
    return sendResponse(res, statusCode, message, data);
};

const sendBadRequest = (res, message = 'Bad Request', data = null) => {
    return sendResponse(res, 400, message, data);
};

const sendUnauthorized = (res, message = 'Unauthorized', data = null) => {
    return sendResponse(res, 401, message, data);
};

const sendForbidden = (res, message = 'Forbidden', data = null) => {
    return sendResponse(res, 403, message, data);
};

const sendNotFound = (res, message = 'Not Found', data = null) => {
    return sendResponse(res, 404, message, data);
};

const sendInternalError = (res, message = 'Internal Server Error', data = null) => {
    return sendResponse(res, 500, message, data);
};

export { 
    ApiResponse,
    sendResponse,
    sendSuccess,
    sendCreated,
    sendUpdated,
    sendDeleted,
    sendError,
    sendBadRequest,
    sendUnauthorized,
    sendForbidden,
    sendNotFound,
    sendInternalError
};