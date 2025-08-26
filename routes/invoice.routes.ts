import { FastifyInstance } from "fastify";
import { InvoiceController } from "../controllers/invoice.controller";

const controller = new InvoiceController()

export default async function InvoiceRoutes(server: FastifyInstance) {
    // Criar uma nova fatura
    server.post('/invoices', controller.create)
    
    // Buscar todas as faturas com paginação
    server.get('/invoices', controller.getAll)
    
    // Buscar fatura por ID
    server.get('/invoices/:id', controller.getOne)
    
    // Buscar faturas por cartão de crédito
    server.get('/invoices/credit-card/:creditCardId', controller.getAllByCreditCardId)
    
    // Buscar faturas por conta (através dos cartões)
    server.get('/invoices/account/:accountId', controller.getAllByAccountId)
    
    // Buscar estatísticas de faturas por cartão
    server.get('/invoices/statistics/:creditCardId', controller.getStatistics)
    
    // Gerar fatura para o período atual
    server.post('/invoices/generate/:creditCardId', controller.generateCurrentInvoice)
    
    // Pagar uma fatura
    server.post('/invoices/:id/pay', controller.payInvoice)
    
    // Atualizar uma fatura
    server.patch('/invoices/:id', controller.patch)
    
    // Deletar uma fatura (apenas se não tiver transações)
    server.delete('/invoices/:id', controller.delete)
}