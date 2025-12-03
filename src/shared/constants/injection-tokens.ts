export const INJECTION_TOKENS = {
  USER_REPOSITORY: Symbol('IUserRepository'),
  POST_REPOSITORY: Symbol('IPostRepository'),
  UNIT_OF_WORK: Symbol('IUnitOfWork'),
  PASSWORD_HASHER: Symbol('IPasswordHasher'),
  TOKEN_GENERATOR: Symbol('ITokenGenerator'),
} as const;
