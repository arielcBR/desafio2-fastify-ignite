export interface User {
  id: string;  
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export type UserCreate = Pick<User, 'email'>;

export interface CreateUserRequest {
  Body: UserCreate;
}

export interface UserRepository {
  create: (data: UserCreate) => Promise<User>;
  findByEmail(email: string): Promise<User | null>;
}