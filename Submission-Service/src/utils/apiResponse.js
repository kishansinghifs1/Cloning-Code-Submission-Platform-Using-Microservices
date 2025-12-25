class ApiResponse {
    static success(data, message = 'Success', statusCode = 200) {
        return {
            success: true,
            message,
            data,
            error: null,
            timestamp: new Date().toISOString()
        };
    }

    static error(message, error = null, data = null, statusCode = 500) {
        return {
            success: false,
            message,
            data: data || null,
            error: error || message,
            timestamp: new Date().toISOString()
        };
    }

    static paginated(data, total, limit, offset, message = 'Success') {
        return {
            success: true,
            message,
            data,
            pagination: {
                total,
                limit,
                offset,
                page: Math.floor(offset / limit) + 1,
                pages: Math.ceil(total / limit)
            },
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = ApiResponse;
