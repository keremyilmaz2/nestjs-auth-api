import { BaseEntity } from './base.entity';

export interface PostImageProps {
  id: string;
  postId: string;
  imageUrl: string;
  s3Key: string;
  order: number;
  createdAt?: Date;
}

export class PostImage extends BaseEntity {
  private _postId: string;
  private _imageUrl: string;
  private _s3Key: string;
  private _order: number;

  private constructor(props: PostImageProps) {
    super(props.id, props.createdAt);
    this._postId = props.postId;
    this._imageUrl = props.imageUrl;
    this._s3Key = props.s3Key;
    this._order = props.order;
  }

  static create(props: PostImageProps): PostImage {
    return new PostImage(props);
  }

  static createNew(
    id: string,
    postId: string,
    imageUrl: string,
    s3Key: string,
    order: number,
  ): PostImage {
    return new PostImage({
      id,
      postId,
      imageUrl,
      s3Key,
      order,
    });
  }

  // Getters
  get postId(): string {
    return this._postId;
  }

  get imageUrl(): string {
    return this._imageUrl;
  }

  get s3Key(): string {
    return this._s3Key;
  }

  get order(): number {
    return this._order;
  }

  toProps(): PostImageProps {
    return {
      id: this._id,
      postId: this._postId,
      imageUrl: this._imageUrl,
      s3Key: this._s3Key,
      order: this._order,
      createdAt: this._createdAt,
    };
  }
}