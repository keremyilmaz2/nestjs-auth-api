import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { UserOrmEntity } from './user.orm-entity';
import { PostImageOrmEntity } from './post-image.orm-entity';

@Entity('posts')
export class PostOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  @Index()
  title: string;

  @Column('text')
  content: string;

  @Column({ name: 'author_id' })
  @Index()
  authorId: string;

  @Column({ name: 'is_published', default: false })
  @Index()
  isPublished: boolean;

  @Column({ name: 'published_at', type: 'timestamp', nullable: true })
  publishedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => UserOrmEntity, (user) => user.posts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'author_id' })
  author: UserOrmEntity;

  @OneToMany(() => PostImageOrmEntity, (image) => image.post, {
    cascade: true,
    eager: true,
  })
  images: PostImageOrmEntity[];
}