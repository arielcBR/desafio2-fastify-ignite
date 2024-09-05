export interface Session {
    id: string;
    userId: string;
    session: string;
    expiresAt: Date;
    createdAt: Date;
}

export type SessionCreate = Pick<Session, 'userId' | 'session' | 'expiresAt'>;

export interface SessionRepository {
  create: (data: SessionCreate) => Promise<Session>;
  findUserBySession: (data: string) => Promise<Session | null>;
  findLastSession: (data: string) => Promise<Session | null>;
}