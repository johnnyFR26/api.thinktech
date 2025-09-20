import { FastifyReply, FastifyRequest } from "fastify";
import { ai } from "../lib/zzinho";

export class IaAgentController {
    async message(request: FastifyRequest<{ Body: { message: string } }>, reply: FastifyReply) {
        const { text } = await ai.generate(request.body.message);
        reply.send({ message: text });
    }
}