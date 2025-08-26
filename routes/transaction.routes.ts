import { FastifyInstance } from "fastify";
import { TransactionController } from "../controllers/transaction.controller";

const controller = new TransactionController()

export default async function TransactionRoutes(server: FastifyInstance) {
    // Create a new transaction
    server.post('/transactions', controller.create)
    
    // Get all transactions with pagination and filtering
    server.get('/transactions', controller.getAll)
    
    // Get transactions by account ID with filters
    server.get('/transactions/account/:accountId', controller.getAllByAccountId)
    
    // Get transactions by category ID
    server.get('/transactions/category/:categoryId', controller.getAllByCategoryId)
    
    // Get transactions by month
    server.post('/transactions/by-yearmonth', controller.getAllByYearMonth)
    
    // Get transaction statistics for an account
    server.get('/transactions/statistics/:accountId', controller.getStatistics)
    
    // Get single transaction by ID
    server.get('/transactions/:id', controller.getOne)
    
    // Update transaction
    server.patch('/transactions/:id', controller.patch)
    
    // Delete transaction
    server.delete('/transactions/:id', controller.delete)
}