import { FastifyReply, FastifyRequest } from "fastify";
import { redisClient } from "../lib/redis";

export async function rateLimit(request: FastifyRequest, reply: FastifyReply) {
    const ip = request.ip;
    const limitKey = `rate-limit:${ip}`;
    
    const requests = await redisClient.incr(limitKey);
  
    if (requests === 1) {
      await redisClient.expire(limitKey, 60); // Expira em 60 segundos
    }
  
    if (requests > 10) {
      return reply.status(429).send({ error: 'Too many requests, please try again later.' });
    }
  }
  