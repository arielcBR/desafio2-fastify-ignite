import { FastifyRequest, FastifyReply } from "fastify";
import { z } from 'zod';
import { uuid } from 'uuidv4';
import { userRepositoryPrisma } from "../repositories/users.repository";
import {
  CreateUserRequest,
  UserRepository,
} from "../interfaces/users.interface";

class UserController {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = userRepositoryPrisma;
  }

  create = async (request: FastifyRequest<CreateUserRequest>, reply: FastifyReply) => {
    const createUserBodySchema = z.object({
      email: z.string().email()
    });

    let sessionId = request.cookies.sessionId;

    if (!sessionId) {
      sessionId = uuid();

      reply.setCookie('sessionId', sessionId, {
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      });
    }

    const { email } = createUserBodySchema.parse(request.body);

    try {
      const user = await this.userRepository.findByEmail(email);
      
      if (user) {
        return reply
          .status(400)
          .send({ errorMessage: 'User already registered!' });
      }
        
      const userCreated = await this.userRepository.create({ email });
      return reply.status(200).send(userCreated);
    } catch (error) {
        console.log(error);
        return reply.status(500).send({ errorMessage: "Internal server error" });
    }
  }
}

const userController = new UserController();

export { userController };
