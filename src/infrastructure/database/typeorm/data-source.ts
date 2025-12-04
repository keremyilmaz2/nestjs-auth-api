import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import { UserOrmEntity } from './entities/user.orm-entity';
import { PostOrmEntity } from './entities/post.orm-entity';

config();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'nestjs_auth_db',
  entities: [UserOrmEntity, PostOrmEntity],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV === 'development',
  // SSL geçici olarak kapatıldı - test için
  ssl: false,
};

const dataSource = new DataSource(dataSourceOptions);

export default dataSource;