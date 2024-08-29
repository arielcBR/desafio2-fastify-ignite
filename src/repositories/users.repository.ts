import {
  User,
  UserCreate,
  UserRepository,
} from "../interfaces/users.interface";
import { prisma } from "../database/prisma-client";

class UserRepositoryPrisma implements UserRepository {
  async create(data: UserCreate): Promise<User> {
      const result = await prisma.users.create({
        data: {
          email: data.email,
          createdAt: new Date(),
        },
      });

      return result;
    }
    
    async findByEmail(email: string): Promise<User | null> {
        const result = await prisma.users.findFirst({
            where: {
                email
            }
        });

        return result || null;
    }
}

const userRepositoryPrisma = new UserRepositoryPrisma();
export { userRepositoryPrisma };
