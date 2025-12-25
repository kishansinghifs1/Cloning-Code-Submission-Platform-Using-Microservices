const fastifyPlugin = require('fastify-plugin');
const servicePlugin = require('./services/servicePlugin');
const repositoryPlugin = require('./repositories/repositoryPlugin');

async function app(fastify, options) {
    await fastify.register(require('@fastify/cors'), { 
        origin: "http://localhost:5173",
        methods: ['GET', 'PUT', 'POST', 'DELETE'], // Specify allowed HTTP methods
        allowedHeaders: ['Content-Type', 'Authorization'], // Specify allowed headers
    });
    await fastify.register(repositoryPlugin);
    await fastify.register(servicePlugin);
    await fastify.register(require('./routes/api/apiRoutes'), { prefix: '/api' });
}

module.exports = fastifyPlugin(app);