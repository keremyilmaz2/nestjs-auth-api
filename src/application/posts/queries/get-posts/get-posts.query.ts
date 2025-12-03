export class GetPostsQuery {
  constructor(
    public readonly page: number = 1,
    public readonly pageSize: number = 10,
    public readonly authorId?: string,
    public readonly onlyPublished: boolean = false,
  ) {}
}
