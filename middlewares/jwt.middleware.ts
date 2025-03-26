import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { RedisClientType } from 'redis'; // Dependendo da versão que você utiliza
import { redisClient } from '../lib/redis';

// Supondo que você já tenha configurado o cliente Redis em outro lugar do seu projeto
 /* importe ou configure o cliente Redis aqui */;

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply,
  next: () => void
) {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return reply.status(401).send({ error: 'Token não fornecido' });
    }

    const token = authHeader.split(' ')[1];
    const secretKey = process.env.JWT_SECRET; // Certifique-se de armazenar sua chave secreta em variáveis de ambiente

    // Verifica o token JWT
    const decoded = jwt.verify(token, secretKey) as { email: string }; // Certifique-se de que o JWT contém o email
    const userEmail = decoded.email;

    if (!userEmail) {
      return reply.status(403).send({ error: 'Token inválido: email não encontrado' });
    }

    // Verifica o token no Redis
    const cachedToken = await redisClient.get(userEmail);
    if (cachedToken !== token) {
      return reply.status(403).send({ error: 'Token inválido ou não autorizado' });
    }

    // Adiciona o payload decodificado ao request para uso posterior
    //request.user = decoded;
    next();
  } catch (error) {
    return reply.status(403).send({ error: 'Erro na autenticação: token inválido ou expirado' });
  }
}