import { BaseEntity } from './base.entity';
import { PostImage } from './post-image.entity';

export interface PostProps {
  id: string;
  title: string;
  content: string;
  authorId: string;
  isPublished: boolean;
  publishedAt?: Date | null;
  images?: PostImage[];
  createdAt?: Date;
  updatedAt?: Date;
}

export class Post extends BaseEntity {
  private _title: string;
  private _content: string;
  private _authorId: string;
  private _isPublished: boolean;
  private _publishedAt: Date | null;
  private _images: PostImage[];

  private constructor(props: PostProps) {
    super(props.id, props.createdAt, props.updatedAt);
    this._title = props.title;
    this._content = props.content;
    this._authorId = props.authorId;
    this._isPublished = props.isPublished;
    this._publishedAt = props.publishedAt || null;
    this._images = props.images || [];
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
      images: [],
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

  get images(): PostImage[] {
    return this._images;
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

  addImage(image: PostImage): void {
    this._images.push(image);
    this.touch();
  }

  addImages(images: PostImage[]): void {
    this._images.push(...images);
    this.touch();
  }

  removeImage(imageId: string): void {
    this._images = this._images.filter((img) => img.id !== imageId);
    this.touch();
  }

  clearImages(): void {
    this._images = [];
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
      images: this._images,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}