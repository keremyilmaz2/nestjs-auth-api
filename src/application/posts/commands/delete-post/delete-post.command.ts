export class DeletePostCommand {
  constructor(
    public readonly postId: string,
    public readonly requesterId: string,
    public readonly requesterRole: string,
  ) {}
}
