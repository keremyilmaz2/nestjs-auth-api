export const ErrorMessages = {
  // Auth
  INVALID_CREDENTIALS: 'Invalid email or password',
  EMAIL_EXISTS: 'Email already registered',
  USERNAME_EXISTS: 'Username already taken',
  ACCOUNT_DEACTIVATED: 'Account is deactivated',
  INVALID_REFRESH_TOKEN: 'Invalid refresh token',
  REFRESH_TOKEN_EXPIRED: 'Refresh token has expired',

  // User
  USER_NOT_FOUND: 'User not found',
  SELF_DELETE_FORBIDDEN: 'Cannot delete your own account',

  // Post
  POST_NOT_FOUND: 'Post not found',
  AUTHOR_NOT_FOUND: 'Author not found',
  NOT_POST_OWNER: 'Not authorized to modify this post',

  // Generic
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  INTERNAL_ERROR: 'Internal server error',
  VALIDATION_ERROR: 'Validation failed',
} as const;
