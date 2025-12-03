import { ValidationException } from '../exceptions/domain.exception';

export class Email {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value.toLowerCase().trim();
  }

  static create(email: string): Email {
    if (!email) {
      throw new ValidationException('Email is required');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationException('Invalid email format');
    }

    return new Email(email);
  }

  get value(): string {
    return this._value;
  }

  equals(other: Email): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }

  getDomain(): string {
    return this._value.split('@')[1];
  }

  getLocalPart(): string {
    return this._value.split('@')[0];
  }
}
