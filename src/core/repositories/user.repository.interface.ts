import { User } from '../domain/entities/user.entity';
import { Role } from '../domain/enums/role.enum';
import { IBaseRepository, PaginatedResult } from './base.repository.interface';

export interface IUserRepository extends IBaseRepository<User> {
  findByEmail(email: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  findByRefreshToken(refreshToken: string): Promise<User | null>;
  findByRole(role: Role): Promise<User[]>;
  findActiveUsers(): Promise<User[]>;
  findActiveUsersPaginated(page: number, pageSize: number): Promise<PaginatedResult<User>>;
  emailExists(email: string): Promise<boolean>;
  usernameExists(username: string): Promise<boolean>;
}

export const USER_REPOSITORY = Symbol('IUserRepository');
