import { BaseEntity } from './base.entity';

export interface PostProps {
  id: string;
  title: string;
  content: string;
  authorId: string;
  isPublished: boolean;
  publishedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Post extends BaseEntity {
  private _title: string;
  private _content: string;
  private _authorId: string;
  private _isPublished: boolean;
  private _publishedAt: Date | null;

  private constructor(props: PostProps) {
    super(props.id, props.createdAt, props.updatedAt);
    this._title = props.title;
    this._content = props.content;
    this._authorId = props.authorId;
    this._isPublished = props.isPublished;
    this._publishedAt = props.publishedAt || null;
  }

  static create(props: PostProps): Post {
    return new Post(props);
  }

  static createNew(
    id: string,
    title: string,
    content: string,
    authorId: string,
  ): Post {
    return new Post({
      id,
      title,
      content,
      authorId,
      isPublished: false,
    });
  }

  // Getters
  get title(): string {
    return this._title;
  }

  get content(): string {
    return this._content;
  }

  get authorId(): string {
    return this._authorId;
  }

  get isPublished(): boolean {
    return this._isPublished;
  }

  get publishedAt(): Date | null {
    return this._publishedAt;
  }

  // Domain Methods
  updateTitle(title: string): void {
    this._title = title;
    this.touch();
  }

  updateContent(content: string): void {
    this._content = content;
    this.touch();
  }

  publish(): void {
    if (!this._isPublished) {
      this._isPublished = true;
      this._publishedAt = new Date();
      this.touch();
    }
  }

  unpublish(): void {
    if (this._isPublished) {
      this._isPublished = false;
      this._publishedAt = null;
      this.touch();
    }
  }

  isOwnedBy(userId: string): boolean {
    return this._authorId === userId;
  }

  toProps(): PostProps {
    return {
      id: this._id,
      title: this._title,
      content: this._content,
      authorId: this._authorId,
      isPublished: this._isPublished,
      publishedAt: this._publishedAt,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
