import { FilterQuery, UpdateQuery, Document } from 'mongoose';

export interface IMongoBaseRepository<T extends Document> {
  findById(id: string, projection?: string): Promise<T | null>;

  findOne(
    filter: FilterQuery<T>,
    options?: {
      sort?: Record<string, 1 | -1>;
    }
  ): Promise<T | null>;

  find(filter: FilterQuery<T>): Promise<T[] | null>;

  findMany(filter?: FilterQuery<T>, projection?: string): Promise<T[] | null>;

  create(item: Partial<T>): Promise<T | null>;

  update(
    id: string,
    update: UpdateQuery<T>,
    options?: any
  ): Promise<T | null>;

  updateOne(
    filter: FilterQuery<T>,
    update: UpdateQuery<T>,
    options?: any
  ): Promise<T | null>;

  findOneAndUpdateUpsert(
    filter: FilterQuery<T>,
    update: UpdateQuery<T>,
    options?: any
  ): Promise<T | null>;

  delete(id: string): Promise<boolean>;

  deleteOne(filter: FilterQuery<T>): Promise<boolean>;
}
