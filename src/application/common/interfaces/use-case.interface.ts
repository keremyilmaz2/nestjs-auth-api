export interface IUseCase<TInput, TOutput> {
  execute(input: TInput): Promise<TOutput>;
}

export interface IUseCaseWithoutInput<TOutput> {
  execute(): Promise<TOutput>;
}
