import { BaseEntity } from './base.entity';
import { Role } from '../enums/role.enum';

export interface UserProps {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  role: Role;
  refreshToken?: string | null;
  refreshTokenExpiresAt?: Date | null;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class User extends BaseEntity {
  private _email: string;
  private _username: string;
  private _passwordHash: string;
  private _role: Role;
  private _refreshToken: string | null;
  private _refreshTokenExpiresAt: Date | null;
  private _isActive: boolean;

  private constructor(props: UserProps) {
    super(props.id, props.createdAt, props.updatedAt);
    this._email = props.email;
    this._username = props.username;
    this._passwordHash = props.passwordHash;
    this._role = props.role;
    this._refreshToken = props.refreshToken || null;
    this._refreshTokenExpiresAt = props.refreshTokenExpiresAt || null;
    this._isActive = props.isActive;
  }

  static create(props: UserProps): User {
    return new User(props);
  }

  static createNew(
    id: string,
    email: string,
    username: string,
    passwordHash: string,
    role: Role = Role.USER,
  ): User {
    return new User({
      id,
      email,
      username,
      passwordHash,
      role,
      isActive: true,
    });
  }

  // Getters
  get email(): string {
    return this._email;
  }

  get username(): string {
    return this._username;
  }

  get passwordHash(): string {
    return this._passwordHash;
  }

  get role(): Role {
    return this._role;
  }

  get refreshToken(): string | null {
    return this._refreshToken;
  }

  get refreshTokenExpiresAt(): Date | null {
    return this._refreshTokenExpiresAt;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  // Domain Methods
  updateEmail(email: string): void {
    this._email = email;
    this.touch();
  }

  updateUsername(username: string): void {
    this._username = username;
    this.touch();
  }

  updatePassword(passwordHash: string): void {
    this._passwordHash = passwordHash;
    this.touch();
  }

  updateRole(role: Role): void {
    this._role = role;
    this.touch();
  }

  setRefreshToken(token: string, expiresAt: Date): void {
    this._refreshToken = token;
    this._refreshTokenExpiresAt = expiresAt;
    this.touch();
  }

  clearRefreshToken(): void {
    this._refreshToken = null;
    this._refreshTokenExpiresAt = null;
    this.touch();
  }

  isRefreshTokenValid(): boolean {
    if (!this._refreshToken || !this._refreshTokenExpiresAt) {
      return false;
    }
    return this._refreshTokenExpiresAt > new Date();
  }

  activate(): void {
    this._isActive = true;
    this.touch();
  }

  deactivate(): void {
    this._isActive = false;
    this.clearRefreshToken();
    this.touch();
  }

  hasRole(role: Role): boolean {
    return this._role === role;
  }

  isAdmin(): boolean {
    return this._role === Role.ADMIN;
  }

  isModerator(): boolean {
    return this._role === Role.MODERATOR || this._role === Role.ADMIN;
  }

  toProps(): UserProps {
    return {
      id: this._id,
      email: this._email,
      username: this._username,
      passwordHash: this._passwordHash,
      role: this._role,
      refreshToken: this._refreshToken,
      refreshTokenExpiresAt: this._refreshTokenExpiresAt,
      isActive: this._isActive,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
