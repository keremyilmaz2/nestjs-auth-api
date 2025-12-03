export class Result<T> {
  public readonly isSuccess: boolean;
  public readonly isFailure: boolean;
  public readonly error?: string;
  public readonly errorCode?: string;
  private readonly _value?: T;

  private constructor(
    isSuccess: boolean,
    error?: string,
    value?: T,
    errorCode?: string,
  ) {
    if (isSuccess && error) {
      throw new Error('InvalidOperation: A result cannot be successful and contain an error');
    }
    if (!isSuccess && !error) {
      throw new Error('InvalidOperation: A failing result needs to contain an error message');
    }

    this.isSuccess = isSuccess;
    this.isFailure = !isSuccess;
    this.error = error;
    this.errorCode = errorCode;
    this._value = value;

    Object.freeze(this);
  }

  public get value(): T {
    if (!this.isSuccess) {
      throw new Error('Cannot get the value of a failed result. Check isSuccess first.');
    }
    return this._value as T;
  }

  public static ok<U>(value: U): Result<U> {
    return new Result<U>(true, undefined, value);
  }

  public static fail<U>(error: string, errorCode?: string): Result<U> {
    return new Result<U>(false, error, undefined, errorCode);
  }

  public static combine(results: Result<unknown>[]): Result<void> {
    for (const result of results) {
      if (result.isFailure) {
        return Result.fail(result.error!, result.errorCode);
      }
    }
    return Result.ok<void>(undefined);
  }

  public map<U>(fn: (value: T) => U): Result<U> {
    if (this.isFailure) {
      return Result.fail<U>(this.error!, this.errorCode);
    }
    return Result.ok(fn(this._value as T));
  }

  public flatMap<U>(fn: (value: T) => Result<U>): Result<U> {
    if (this.isFailure) {
      return Result.fail<U>(this.error!, this.errorCode);
    }
    return fn(this._value as T);
  }

  public getOrElse(defaultValue: T): T {
    if (this.isFailure) {
      return defaultValue;
    }
    return this._value as T;
  }

  public getOrThrow(): T {
    if (this.isFailure) {
      throw new Error(this.error);
    }
    return this._value as T;
  }
}
