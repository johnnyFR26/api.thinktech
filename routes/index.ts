import { FastifyInstance } from 'fastify';
import UserRoutes from './user.routes';
import AuthRoutes from './auth.routes';

/**
 * Registers all application routes with the provided Fastify server instance.
 *
 * @param server - The Fastify server instance to register the routes with.
 * @returns {Promise<void>}
 */
export const registerRoutes = async (server: FastifyInstance) => {
  await server.register(UserRoutes);
  await server.register(AuthRoutes);
};
