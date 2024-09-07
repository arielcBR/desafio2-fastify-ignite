import { FastifyReply, FastifyRequest } from "fastify";
import { sessionRepositoryPrisma } from '../repositories/sessions.repository';

export async function authUser(request: FastifyRequest, reply: FastifyReply) {
    const session = request.cookies?.sessionId;
    
    if(!session)
        return reply
          .status(401)
          .send({ message: "Unauthorized, session not found" });
    
    const sessionStatus = await isSessionValid(session);

    if(!sessionStatus)
        return reply.status(401).send({ message: 'Unauthorized, session is expired' });
    
    return;
}

async function isSessionValid(session: string) {
    const todayDate = new Date(Date.now());
    const result = await sessionRepositoryPrisma.findUserBySession(session);

    return !!result && result.expiresAt > todayDate;
}