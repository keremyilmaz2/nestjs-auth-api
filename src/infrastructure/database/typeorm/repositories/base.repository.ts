import { Repository, EntityManager, FindOptionsWhere, ObjectLiteral } from 'typeorm';
import { FindOptions, PaginatedResult } from '@core/repositories/base.repository.interface';

export abstract class BaseRepository<TDomain, TOrm extends ObjectLiteral> {
  constructor(
    protected readonly repository: Repository<TOrm>,
    protected readonly entityManager?: EntityManager,
  ) {}

  protected abstract toDomain(orm: TOrm): TDomain;
  protected abstract toOrm(domain: TDomain): TOrm;
  protected abstract getId(domain: TDomain): string;

  async findById(id: string): Promise<TDomain | null> {
    const entity = await this.repository.findOne({
      where: { id } as unknown as FindOptionsWhere<TOrm>,
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(options?: FindOptions): Promise<TDomain[]> {
    const queryOptions: any = {};

    if (options?.skip !== undefined) {
      queryOptions.skip = options.skip;
    }
    if (options?.take !== undefined) {
      queryOptions.take = options.take;
    }
    if (options?.orderBy) {
      queryOptions.order = {
        [options.orderBy.field]: options.orderBy.direction,
      };
    }

    const entities = await this.repository.find(queryOptions);
    return entities.map((entity) => this.toDomain(entity));
  }

  async findAllPaginated(page: number, pageSize: number): Promise<PaginatedResult<TDomain>> {
    const skip = (page - 1) * pageSize;
    const [entities, total] = await this.repository.findAndCount({
      skip,
      take: pageSize,
      order: { createdAt: 'DESC' } as any,
    });

    const totalPages = Math.ceil(total / pageSize);

    return {
      items: entities.map((entity) => this.toDomain(entity)),
      total,
      page,
      pageSize,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  async create(entity: TDomain): Promise<TDomain> {
    const ormEntity = this.toOrm(entity);
    const manager = this.entityManager || this.repository.manager;
    const savedEntity = await manager.save(ormEntity);
    return this.toDomain(savedEntity);
  }

  async update(entity: TDomain): Promise<TDomain> {
    const ormEntity = this.toOrm(entity);
    const manager = this.entityManager || this.repository.manager;
    const savedEntity = await manager.save(ormEntity);
    return this.toDomain(savedEntity);
  }

  async delete(id: string): Promise<void> {
    const manager = this.entityManager || this.repository.manager;
    await manager.delete(this.repository.target, id);
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.repository.count({
      where: { id } as unknown as FindOptionsWhere<TOrm>,
    });
    return count > 0;
  }

  async count(): Promise<number> {
    return this.repository.count();
  }
}
