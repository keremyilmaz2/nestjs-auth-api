import { PostImage } from '../../../core/domain/entities/post-image.entity';
import { PostImageOrmEntity } from '../typeorm/entities/post-image.orm-entity';

export class PostImageMapper {
  static toDomain(ormEntity: PostImageOrmEntity): PostImage {
    return PostImage.create({
      id: ormEntity.id,
      postId: ormEntity.postId,
      imageUrl: ormEntity.imageUrl,
      s3Key: ormEntity.s3Key,
      order: ormEntity.order,
      createdAt: ormEntity.createdAt,
    });
  }

  static toOrmEntity(domain: PostImage): PostImageOrmEntity {
    const ormEntity = new PostImageOrmEntity();
    ormEntity.id = domain.id;
    ormEntity.postId = domain.postId;
    ormEntity.imageUrl = domain.imageUrl;
    ormEntity.s3Key = domain.s3Key;
    ormEntity.order = domain.order;
    ormEntity.createdAt = domain.createdAt;
    return ormEntity;
  }

  static toDomainArray(ormEntities: PostImageOrmEntity[]): PostImage[] {
    return ormEntities.map((ormEntity) => this.toDomain(ormEntity));
  }

  static toOrmEntityArray(domains: PostImage[]): PostImageOrmEntity[] {
    return domains.map((domain) => this.toOrmEntity(domain));
  }
}