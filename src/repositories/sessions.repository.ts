import { prisma } from '../database/prisma-client';
import { Session, SessionCreate, SessionRepository } from '../interfaces/sessions.interface';

class SessionRepositoryPrisma implements SessionRepository{
    async create(data: SessionCreate): Promise<Session> {
        const session = await prisma.session.create({
            data: {
                userId: data.userId,
                session: data.session,
                expiresAt: data.expiresAt,
            }
        });

        return session;
    }

    async findUserBySession(data: string): Promise<Session | null> {
        const session = await prisma.session.findFirst({
            where: {
                session: data
            }
        });

        return session || null;
    }
}

const sessionRepositoryPrisma = new SessionRepositoryPrisma();
export { sessionRepositoryPrisma }