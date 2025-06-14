import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { db } from "../lib/db";
import { redisClient } from "../lib/redis";
import { Prisma } from "@prisma/client";

const createCreditCardSchema = z.object({
  availableLimit: z.string(),
  limit: z.string(),
  company: z.string().min(2, 'Company name is required'),
  expire: z.coerce.date(),
  close: z.coerce.date(),
  accountId: z.string().uuid('Invalid account ID'),
  controls: z.string().nullable().optional()
});

const updateCreditCardSchema = createCreditCardSchema.partial();

export class CreditCardController {
 
  /**
   * Retrieves all credit cards.
   *
   * @function
   * @memberof module:controllers.CreditCardController
   * @param request - The incoming request.
   * @param reply - The reply to be sent back to the client.
   *
   * @example
   * curl -X GET 'http://localhost:3000/creditCards'
   *
   * @throws {Error} If an error occurs while retrieving credit cards.
   * @returns {Promise<void>}
   */
  async getAll(request: FastifyRequest, reply: FastifyReply) {
    const cacheKey = "all_credit_cards";

    const cached = await redisClient.get(cacheKey);
    if (cached) {
      console.log("⚡ Returning cached credit cards");
      return reply.status(200).send(JSON.parse(cached));
    }

    const creditCards = await db.creditCard.findMany();

    await redisClient.setEx(cacheKey, 50, JSON.stringify(creditCards));

    return reply.status(200).send(creditCards);
  }

  
/**
 * Retrieves a credit card by ID.
 *
 * @function
 * @memberof module:controllers.CreditCardController
 * @param request - The incoming request containing the ID of the credit card to be retrieved.
 * @param reply - The reply to be sent back to the client.
 *
 * @example
 * curl -X GET 'http://localhost:3000/creditCards/{id}'
 *
 * @throws {Error} If the ID is not valid or the credit card is not found.
 * @returns {Promise<void>}
 */

  async getOne(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const { id } = request.params;

    const validation = z.string().uuid("Invalid id").safeParse(id);

    if (!validation.success) {
      return reply.status(400).send({
        error: validation.error.format(),
      });
    }

    const creditCard = await db.creditCard.findUnique({
      where: { id },
    });

    if (!creditCard) {
      return reply.status(404).send("Credit card not found");
    }

    return reply.status(200).send(creditCard);
  }


  /**
   * ✍️ Create a new credit card
   * 
   * @function
   * @memberof module:controllers.CreditCardController
   * @param request - The incoming request containing the credit card data.
   * @param reply - The reply to be sent back to the client.
   * 
   * @example
   * curl -X POST 'http://localhost:3000/creditCards' 
   * -H 'Content-Type: application/json' 
   * -d '{ "availableLimit": "100", "limit": "100", "company": "Test Company", "expire": "2025-01-01", "close": "2025-01-01", "accountId": "123e4567-e89b-12d3-a456-426614174000", "controls": "[]"}'
   *
   * @throws {Error} If an error occurs while creating a credit card.
   * @returns {Promise<void>}
   */
  async create(
    request: FastifyRequest<{ Body: any }>,
    reply: FastifyReply
  ) {
    const validation = createCreditCardSchema.safeParse(request.body);

    if (!validation.success) {
      return reply.status(400).send({
        error: validation.error.format(),
      });
    }

    const data = validation.data;

    try {
      const card = await db.creditCard.create({
        data: {
                availableLimit: new Prisma.Decimal(data.availableLimit),
                limit: new Prisma.Decimal(data.limit),
                company: data.company,
                expire: data.expire,
                close: data.close,
                accountId: data.accountId,
                controls: data.controls ? JSON.parse(data.controls) : undefined,
            },
        });


      return reply.status(201).send(card);
    } catch (error) {
      reply.status(500).send({
        error,
        data,
      });
    }
  }


  /**
   * ✍️ Update a credit card by ID
   * 
   * @param id - The ID of the credit card to update
   * @param data - The new data for the credit card
   * @returns The updated credit card
   * @throws {Error} If the credit card is not found
   */
  async update(
    request: FastifyRequest<{
      Params: { id: string };
      Body: any;
    }>,
    reply: FastifyReply
  ) {
    const { id } = request.params;

    const validation = updateCreditCardSchema.safeParse(request.body);
    if (!validation.success) {
      return reply.status(400).send({
        error: validation.error.format(),
      });
    }

    const data = validation.data;

    try {
      const updatedCard = await db.creditCard.update({
        where: { id },
        data: {
          ...data,
          controls: data.controls ? JSON.parse(data.controls) : undefined,
        },
      });

      return reply.status(200).send(updatedCard);
    } catch (error) {
      return reply.status(404).send({
        error: "Credit card not found",
      });
    }
  }

 
  /**
   * Deletes a credit card by ID.
   * 
   * @function
   * @memberof module:controllers.CreditCardController
   * @param request - The incoming request containing the ID of the credit card to be deleted.
   * @param reply - The reply to be sent back to the client.
   * 
   * @example
   * curl -X DELETE 'http://localhost:3000/creditCards/{id}'
   * 
   * @throws {Error} If an error occurs while deleting the credit card.
   * @returns {Promise<void>}
   */
  async delete(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const { id } = request.params;

    try {
      const deleted = await db.creditCard.delete({
        where: { id },
      });

      return reply.status(200).send(deleted);
    } catch (error) {
      return reply.status(500).send({
        error,
        id,
      });
    }
  }
}
