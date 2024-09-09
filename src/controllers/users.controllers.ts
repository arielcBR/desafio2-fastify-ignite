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

  private async createSession(reply: FastifyReply, userId: string) {
    const sessionId = uuidv4();

    const { session } = await this.sessionRepository.create({
      userId,
      expiresAt: getExpireDate(),
      session: sessionId,
    });

    this.setUserCookies(reply, session, userId);

    return session;
  }

  private setUserCookies(reply: FastifyReply, session: string, userId: string) {
    const cookieOptions = {
      path: "/",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    };

    reply.setCookie("sessionId", session, cookieOptions);
    reply.setCookie("userId", userId, cookieOptions);
  }

  private sendResponse(reply: FastifyReply, status: number, message: any) {
    reply.status(status).send(message);
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
        const session = await this.createSession(reply, userCreated.id);
        return this.sendResponse(reply, 200, { userCreated, session });
      }

      return this.sendResponse(reply, 409, {
        message: "User already registered!",
      });
    } catch (error) {
      console.error(error);
      return this.sendResponse(reply, 500, {
        errorMessage: "Internal server error",
      });
    }
  };

  createSessionForUser = async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    const createSessionBodySchema = z.object({
      email: z.string().email(),
    });

    const emailValidation = createSessionBodySchema.safeParse(request.body);

    if (!emailValidation.success) {
      return this.sendResponse(reply, 400, {
        message: "The email sent is invalid",
      });
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
          const newSession = await this.createSession(reply, user.id);
          return reply.status(200).send({ session: newSession });
        } else {
          this.setUserCookies(reply, sessionExists.session, user.id);
          return this.sendResponse(reply, 200, { session: sessionExists });
        }
      }

      return this.sendResponse(reply, 400, {
        message: "User cannot be found!",
      });
    } catch (error) {
      console.error(error);
      return this.sendResponse(reply, 500, {
        errorMessage: "Internal server error",
      });
    }
  };

  getMetrics = async (request: FastifyRequest, reply: FastifyReply) => {
    const userIdParamsSchema = z.object({
      id: z.string().uuid(),
    });

    const result = userIdParamsSchema.safeParse(request.params);

    if (!result.success) {
      return this.sendResponse(reply, 400, {
        message: "The user ID provided is invalid or does not exist",
      });
    }

    const userId = request.cookies.userId;
    const userIdParam = result.data.id;

    if (userIdParam !== userId) {
      return this.sendResponse(reply, 401, {
        message: "Unauthorized, metrics can only be accessed by its owner",
      });
    }

    try {
      const userMetrics = await this.userRepository.getMetrics(userId);
      return this.sendResponse(reply, 200, { userMetrics });
    } catch (error) {
      console.error(error);
      return this.sendResponse(reply, 500, {
        message: "Internal server error",
      });
    }
  };
}

const userController = new UserController();

export { userController };
