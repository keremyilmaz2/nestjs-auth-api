export class CreatePostCommand {
  constructor(
    public readonly title: string,
    public readonly content: string,
    public readonly authorId: string,
    public readonly isPublished: boolean = false,
    public readonly imageFiles?: Express.Multer.File[], // YENİ
  ) {}
}