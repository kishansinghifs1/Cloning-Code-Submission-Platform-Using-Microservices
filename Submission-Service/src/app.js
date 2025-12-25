const fastifyPlugin = require('fastify-plugin');
const servicePlugin = require('./services/servicePlugin');
const repositoryPlugin = require('./repositories/repositoryPlugin');

async function app(fastify, options) {
    await fastify.register(require('@fastify/cors'));
    await fastify.register(repositoryPlugin);
    await fastify.register(servicePlugin);
    await fastify.register(require('./routes/api/apiRoutes'), { prefix: '/api' });
}

module.exports = fastifyPlugin(app);