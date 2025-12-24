const { StatusCodes } = require('http-status-codes');

const validateRequest = (schema) => {
    return (req, res, next) => {
        try {
            // validating the request body with the schema and updating req.body with the parsed (and potentially transformed) data
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
