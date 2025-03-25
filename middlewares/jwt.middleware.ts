import { jwt } from 'jsonwebtoken';
import { FastifyReply, FastifyRequest } from 'fastify';
export async function jwtMiddleware(request: FastifyRequest<any>, reply: FastifyReply) {
    try {
        if (!request.headers.authorization) {
           return reply.code(401).send({ message: 'Unauthorized' });
        }
        const token = request.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded) {
            return console.log('Authorized');
        }
    } catch (err) {
        reply.code(401).send({ message: 'Unauthorized' });
    }
}