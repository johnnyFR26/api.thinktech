import { FastifyPluginAsync } from 'fastify';
import fastifyCors from '@fastify/cors';

/**
 * Registers the CORS middleware with the Fastify server, allowing cross-origin
 * requests from specified origins.
 */
const corsMiddleware: FastifyPluginAsync = async (server) => {
  await server.register(fastifyCors, {
    origin: [
      /\.vercel\.app$/,
      'http://localhost:3000',
      'http://localhost:4200',
    ],
    credentials: false,
  });
};

export default corsMiddleware;