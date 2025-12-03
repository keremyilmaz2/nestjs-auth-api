export class UpdatePostCommand {
  constructor(
    public readonly postId: string,
    public readonly requesterId: string,
    public readonly requesterRole: string,
    public readonly title?: string,
    public readonly content?: string,
    public readonly isPublished?: boolean,
  ) {}
}
