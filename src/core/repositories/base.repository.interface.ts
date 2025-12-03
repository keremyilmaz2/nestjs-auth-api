export interface FindOptions {
  skip?: number;
  take?: number;
  orderBy?: {
    field: string;
    direction: 'ASC' | 'DESC';
  };
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface IBaseRepository<T> {
  findById(id: string): Promise<T | null>;
  findAll(options?: FindOptions): Promise<T[]>;
  findAllPaginated(page: number, pageSize: number): Promise<PaginatedResult<T>>;
  create(entity: T): Promise<T>;
  update(entity: T): Promise<T>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
  count(): Promise<number>;
}
