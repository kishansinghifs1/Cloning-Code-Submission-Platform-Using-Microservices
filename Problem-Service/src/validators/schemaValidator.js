const { StatusCodes } = require('http-status-codes');

const validateRequest = (schema) => {
    return (req, res, next) => {
        try {
            req.body = schema.parse(req.body);
            next();
        } catch (error) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'Invalid request data',
                data: {},
                error: error.errors
            });
        }
    };
};

module.exports = validateRequest;
