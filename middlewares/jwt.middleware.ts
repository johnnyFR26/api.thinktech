// src/middlewares/auth.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { redisClient } from '../lib/redis';

type JwtPayload = { email: string; sub?: string; jti?: string };

export async function authPreHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = (request.headers.authorization ?? '') as string;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Token não fornecido' });
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      request.log.error('JWT_SECRET não definido');
      return reply.status(500).send({ error: 'Server misconfiguration' });
    }

    const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] }) as JwtPayload;

    const userEmail = decoded.email;
    if (!userEmail) {
      return reply.status(403).send({ error: 'Token inválido: email ausente' });
    }

    const cached = await redisClient.get(`auth:token:${userEmail}`);
    if (!cached || cached !== token) {
      return reply.status(403).send({ error: 'Token inválido ou revogado' });
    }

    (request as any).user = decoded;

    return;
  } catch (err) {
    request.log.warn({ err }, 'Falha na autenticação');
    return reply.status(401).send({ error: 'Token inválido ou expirado' });
  }
}
