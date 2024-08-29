import { FastifyRequest, FastifyReply } from "fastify";
import { z } from 'zod'
import { userRepositoryPrisma } from "../repositories/users.repository";
import {
  CreateUserRequest,
  UserRepository,
} from "../interfaces/users.interface";
import { validateEmail } from "../utils/validateEmail";

class UserController {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = userRepositoryPrisma;
  }

  create = async (request: FastifyRequest<CreateUserRequest>, reply: FastifyReply) => {
    const email = request.body?.email;
    const createUserBodySchema = z.object({
      email: z.string().email()
    });

    try {
      const isEmailValid = validateEmail(email);

      if (!isEmailValid) {
        return reply
          .status(400)
          .send({ errorMessage: "The email sent is invalid!" });
      }

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
