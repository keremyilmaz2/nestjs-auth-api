import { Role } from '@core/domain/enums/role.enum';

export class RegisterCommand {
  constructor(
    public readonly email: string,
    public readonly username: string,
    public readonly password: string,
    public readonly role: Role = Role.USER,
  ) {}
}
