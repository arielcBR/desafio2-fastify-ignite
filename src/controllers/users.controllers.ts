import { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { userRepositoryPrisma } from "../repositories/users.repository";
import { sessionRepositoryPrisma } from "../repositories/sessions.repository";
import {
  CreateUserRequest,
  UserRepository,
} from "../interfaces/users.interface";
import { SessionRepository } from "../interfaces/sessions.interface";
import { getExpireDate } from "../helpers/expireDateSession";

class UserController {
  private userRepository: UserRepository;
  private sessionRepository: SessionRepository;

  constructor() {
    this.userRepository = userRepositoryPrisma;
    this.sessionRepository = sessionRepositoryPrisma;
  }

  private async newSession(reply: FastifyReply, userId: string) {
    const sessionId = uuidv4();

    const { session } = await this.sessionRepository.create({
      userId,
      expiresAt: getExpireDate(),
      session: sessionId,
    });

    reply.setCookie("sessionId", session, {
      path: "/",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    });

    reply.setCookie("userId", userId, {
      path: "/",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    });

    return session;
  }

  create = async (
    request: FastifyRequest<CreateUserRequest>,
    reply: FastifyReply
  ) => {
    const createUserBodySchema = z.object({
      email: z.string().email(),
    });

    const { email } = createUserBodySchema.parse(request.body);

    try {
      const user = await this.userRepository.findByEmail(email);

      if (!user) {
        const userCreated = await this.userRepository.create({ email });
        const session = await this.newSession(reply, userCreated.id);
        return reply.status(200).send({ userCreated, session });
      }

      return reply.status(409).send({ message: "User already registered!" });
    } catch (error) {
      console.log(error);
      return reply.status(500).send({ errorMessage: "Internal server error" });
    }
  };

  createSession = async (request: FastifyRequest, reply: FastifyReply) => {
    const createSessionBodySchema = z.object({
      email: z.string().email(),
    });

    const emailValidation = createSessionBodySchema.safeParse(request.body);

    if (!emailValidation.success) {
      return reply.status(400).send({ message: `The email sent is invalid` });
    }

    try {
      const user = await this.userRepository.findByEmail(
        emailValidation.data.email
      );

      if (user) {
        const sessionExists = await this.sessionRepository.findLastSession(
          user.id
        );

        if (!sessionExists) {
          const newSession = await this.newSession(reply, user.id);
          return reply.status(200).send({ newSession });
        } else {
          reply.setCookie("userId", user.id, {
            path: "/",
            maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
          });
          return reply.status(200).send({ session: sessionExists });
        }
      }

      return reply.status(400).send({ message: "User cannot be found!" });
    } catch (error) {
      console.log(error);
      return reply.status(500).send({ errorMessage: "Internal server error" });
    }
  };
}

const userController = new UserController();

export { userController };
