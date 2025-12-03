export class DomainException extends Error {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'DomainException';
    Object.setPrototypeOf(this, DomainException.prototype);
  }
}

export class EntityNotFoundException extends DomainException {
  constructor(entityName: string, id: string) {
    super(`${entityName} with id '${id}' not found`, 'ENTITY_NOT_FOUND');
    this.name = 'EntityNotFoundException';
  }
}

export class BusinessRuleException extends DomainException {
  constructor(message: string) {
    super(message, 'BUSINESS_RULE_VIOLATION');
    this.name = 'BusinessRuleException';
  }
}

export class InvalidOperationException extends DomainException {
  constructor(message: string) {
    super(message, 'INVALID_OPERATION');
    this.name = 'InvalidOperationException';
  }
}

export class UnauthorizedException extends DomainException {
  constructor(message: string = 'Unauthorized access') {
    super(message, 'UNAUTHORIZED');
    this.name = 'UnauthorizedException';
  }
}

export class ForbiddenException extends DomainException {
  constructor(message: string = 'Access forbidden') {
    super(message, 'FORBIDDEN');
    this.name = 'ForbiddenException';
  }
}

export class ValidationException extends DomainException {
  constructor(
    message: string,
    public readonly errors?: Record<string, string[]>,
  ) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationException';
  }
}

export class ConflictException extends DomainException {
  constructor(message: string) {
    super(message, 'CONFLICT');
    this.name = 'ConflictException';
  }
}
