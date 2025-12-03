import { User, UserProps } from '@core/domain/entities/user.entity';
import { UserOrmEntity } from '../typeorm/entities/user.orm-entity';

export class UserMapper {
  static toDomain(ormEntity: UserOrmEntity): User {
    const props: UserProps = {
      id: ormEntity.id,
      email: ormEntity.email,
      username: ormEntity.username,
      passwordHash: ormEntity.passwordHash,
      role: ormEntity.role,
      refreshToken: ormEntity.refreshToken,
      refreshTokenExpiresAt: ormEntity.refreshTokenExpiresAt,
      isActive: ormEntity.isActive,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    };
    return User.create(props);
  }

  static toOrm(domain: User): UserOrmEntity {
    const ormEntity = new UserOrmEntity();
    const props = domain.toProps();

    ormEntity.id = props.id;
    ormEntity.email = props.email;
    ormEntity.username = props.username;
    ormEntity.passwordHash = props.passwordHash;
    ormEntity.role = props.role;
    ormEntity.refreshToken = props.refreshToken || null;
    ormEntity.refreshTokenExpiresAt = props.refreshTokenExpiresAt || null;
    ormEntity.isActive = props.isActive;
    ormEntity.createdAt = props.createdAt!;
    ormEntity.updatedAt = props.updatedAt!;

    return ormEntity;
  }

  static toDomainList(ormEntities: UserOrmEntity[]): User[] {
    return ormEntities.map((entity) => UserMapper.toDomain(entity));
  }
}
