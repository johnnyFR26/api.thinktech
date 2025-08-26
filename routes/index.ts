import { CreditCard } from './../models/creditcard.model';
import { FastifyInstance } from 'fastify';
import UserRoutes from './user.routes';
import AuthRoutes from './auth.routes';
import AccountRoutes from './account.routes';
import TransactionRoutes from './transaction.routes';
import BotRoutes from './bot.routes';
import CategoryRoutes from './category.routes';
import CreditCardRoutes from './creditcard.routes';
import InvoiceRoutes from './invoice.routes';

/**
 * Registers all application routes with the provided Fastify server instance.
 *
 * @param server - The Fastify server instance to register the routes with.
 * @returns {Promise<void>}
 */
export const registerRoutes = async (server: FastifyInstance) => {
  await server.register(UserRoutes);
  await server.register(AuthRoutes);
  await server.register(AccountRoutes)
  await server.register(TransactionRoutes)
  await server.register(BotRoutes)
  await server.register(CategoryRoutes)
  await server.register(InvoiceRoutes)
  await server.register(CreditCardRoutes)
};
