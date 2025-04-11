import { Category } from "@prisma/client";
import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { db } from "../lib/db";

const createCategorySchema = z.object({
    name: z.string().max(50, "Your category name can't have more than 50 characters"),
    accountId: z.string().uuid("Invalid account id"),
})

const updateCategorySchema = createCategorySchema.partial()

export class CategoryController {

        async create(request: FastifyRequest<{Body: Category}>, reply: FastifyReply) {
            const validation = createCategorySchema.safeParse(request.body)

            if(!validation.success) {
                return reply.status(400).send({
                    error: validation.error.format()
                })
            }
            const data = validation.data

            try {
                const category = await db.category.create({
                    data: {
                        name: data.name,
                        accountId: data.accountId,
                    }
                })
                return reply.status(201).send(category)
            } catch (error) {
                return reply.status(500).send('Error creating category')
            }

        }

        async getAll(request: FastifyRequest, reply: FastifyReply) {
        const categories = await db.category.findMany()
        reply.status(200).send(categories)
    }
}