import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserOrmEntity, PostOrmEntity } from './entities';
import { PostImageOrmEntity } from './entities/post-image.orm-entity'; // YENİ
import { UserRepository, PostRepository } from './repositories';
import { UnitOfWork } from './unit-of-work';
import { USER_REPOSITORY } from '@core/repositories/user.repository.interface';
import { POST_REPOSITORY } from '@core/repositories/post.repository.interface';
import { UNIT_OF_WORK } from '@core/unit-of-work';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'postgres'),
        database: configService.get<string>('DB_NAME', 'nestjs_auth_db'),
        entities: [UserOrmEntity, PostOrmEntity, PostImageOrmEntity], // PostImageOrmEntity eklendi
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
        logging: configService.get<string>('NODE_ENV') === 'development',
      }),
    }),
    TypeOrmModule.forFeature([UserOrmEntity, PostOrmEntity, PostImageOrmEntity]), // PostImageOrmEntity eklendi
  ],
  providers: [
    UserRepository,
    PostRepository,
    {
      provide: USER_REPOSITORY,
      useExisting: UserRepository,
    },
    {
      provide: POST_REPOSITORY,
      useExisting: PostRepository,
    },
    {
      provide: UNIT_OF_WORK,
      useClass: UnitOfWork,
    },
  ],
  exports: [
    TypeOrmModule,
    USER_REPOSITORY,
    POST_REPOSITORY,
    UNIT_OF_WORK,
    UserRepository,
    PostRepository,
  ],
})
export class DatabaseModule {}