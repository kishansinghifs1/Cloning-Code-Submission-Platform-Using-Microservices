const fastifyPlugin = require('fastify-plugin');
const servicePlugin = require('./services/servicePlugin');
const repopsitoryPlugin = require('./repositories/repositoryPlugin');
const todoRoutes = require('./routes/api/v1/submissionRoutes');

async function app(fastify, options) {
    await fastify.register(require('@fastify/cors'));
    await fastify.register(repopsitoryPlugin);
    await fastify.register(servicePlugin);
    await fastify.register(todoRoutes, {prefix: '/todos'});
    await fastify.register(require('./routes/api/apiRoutes'), {prefix: '/api'});
}

module.exports = fastifyPlugin(app);