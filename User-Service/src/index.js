const express = require('express');
const bodyParser = require('body-parser');

const { PORT } = require('./config/server.config');
const apiRouter = require('./routes');
const errorHandler = require('./utils/errorHandler');
const connectToDB = require('./config/db.config');

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.text());

// All requests that start with /api will be mapped to apiRouter
app.use('/api', apiRouter);

// Health check endpoint
app.get('/ping', (req, res) => {
    return res.json({ message: 'User Service is alive' });
});

// Global error handler
app.use(errorHandler);

// Start server
app.listen(PORT, async () => {
    console.log(`Server started at PORT: ${PORT}`);
    try {
        await connectToDB.connect();
    } catch (error) {
        console.log("DB Connection failed", error);
    }
});

// Graceful Shutdown
async function shutdown(signal) {
    console.log(`Received ${signal}. Shutting down gracefully...`);
    await connectToDB.disconnect();
    console.log('Server shutdown complete');
    process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
