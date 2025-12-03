import { ValidationException } from '../exceptions/domain.exception';

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

export class Password {
  private readonly _value: string;
  private static readonly MIN_LENGTH = 8;
  private static readonly MAX_LENGTH = 128;

  private constructor(value: string) {
    this._value = value;
  }

  static create(password: string): Password {
    const validation = Password.validate(password);
    if (!validation.isValid) {
      throw new ValidationException(
        'Password validation failed',
        { password: validation.errors },
      );
    }
    return new Password(password);
  }

  static createWithoutValidation(password: string): Password {
    return new Password(password);
  }

  static validate(password: string): PasswordValidationResult {
    const errors: string[] = [];

    if (!password) {
      errors.push('Password is required');
      return { isValid: false, errors };
    }

    if (password.length < Password.MIN_LENGTH) {
      errors.push(`Password must be at least ${Password.MIN_LENGTH} characters`);
    }

    if (password.length > Password.MAX_LENGTH) {
      errors.push(`Password must not exceed ${Password.MAX_LENGTH} characters`);
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  get value(): string {
    return this._value;
  }

  equals(other: Password): boolean {
    return this._value === other._value;
  }
}
