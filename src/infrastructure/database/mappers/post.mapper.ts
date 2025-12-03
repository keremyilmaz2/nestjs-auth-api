import { Post, PostProps } from '@core/domain/entities/post.entity';
import { PostOrmEntity } from '../typeorm/entities/post.orm-entity';

export class PostMapper {
  static toDomain(ormEntity: PostOrmEntity): Post {
    const props: PostProps = {
      id: ormEntity.id,
      title: ormEntity.title,
      content: ormEntity.content,
      authorId: ormEntity.authorId,
      isPublished: ormEntity.isPublished,
      publishedAt: ormEntity.publishedAt,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    };
    return Post.create(props);
  }

  static toOrm(domain: Post): PostOrmEntity {
    const ormEntity = new PostOrmEntity();
    const props = domain.toProps();

    ormEntity.id = props.id;
    ormEntity.title = props.title;
    ormEntity.content = props.content;
    ormEntity.authorId = props.authorId;
    ormEntity.isPublished = props.isPublished;
    ormEntity.publishedAt = props.publishedAt || null;
    ormEntity.createdAt = props.createdAt!;
    ormEntity.updatedAt = props.updatedAt!;

    return ormEntity;
  }

  static toDomainList(ormEntities: PostOrmEntity[]): Post[] {
    return ormEntities.map((entity) => PostMapper.toDomain(entity));
  }
}
