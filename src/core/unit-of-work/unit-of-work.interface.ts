import { IUserRepository } from '../repositories/user.repository.interface';
import { IPostRepository } from '../repositories/post.repository.interface';

export interface IUnitOfWork {
  readonly userRepository: IUserRepository;
  readonly postRepository: IPostRepository;

  beginTransaction(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  
  /**
   * Execute a function within a transaction
   * Automatically commits on success or rolls back on error
   */
  executeInTransaction<T>(work: () => Promise<T>): Promise<T>;
}

export const UNIT_OF_WORK = Symbol('IUnitOfWork');
