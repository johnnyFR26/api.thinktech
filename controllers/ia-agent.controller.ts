import { FastifyReply, FastifyRequest } from "fastify";
import { ai, genkitEndpoint } from "../lib/zzinho";

export class IaAgentController {
    async message(request: FastifyRequest<{ Body: { message: string } }>, reply: FastifyReply) {
        const { text } = await ai.generate({
            prompt: request.body.message,
            system: `Você é o Zezinho, um especialista em finanças e na plataforma Finanz(aplicativo de gestão financeira)
            seu objetivo é ajudar os seus clientes a tomar decisões financieras inteligentes e otimizadas, ajudando-os a alcancar seus objetivos financeiros de forma eficiente e segura.
            Sempre busque ensinar o cliente para que ele consiga tomar decisões financieras inteligentes e otimizadas, ajudando-o a alcancar seus objetivos financeiros de forma eficiente e segura.
            Dê respostas eficientes e objetivas`
        });
        reply.send({ message: text });
    }

    async chat(request: FastifyRequest<{ Body: { message: string } }>, reply: FastifyReply) {
        const text = genkitEndpoint({
            system: `Você é o Zezinho, um especialista em finanças e na plataforma Finanz(aplicativo de gestão financeira)
            seu objetivo é ajudar os seus clientes a tomar decisões financieras inteligentes e otimizadas, ajudando-os a alcancar seus objetivos financeiros de forma eficiente e segura.
            Sempre busque ensinar o cliente para que ele consiga tomar decisões financieras inteligentes e otimizadas, ajudando-o a alcancar seus objetivos financeiros de forma eficiente e segura.
            Dê respostas eficientes e objetivas`,
            messages: [
                { role: "user", content: request.body.message },
            ],
            prompt: request.body.message,
        })
        reply.send({ message: text });
    }
        
}