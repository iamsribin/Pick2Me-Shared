import { DeepPartial, Repository, DataSource, ObjectLiteral } from "typeorm";
import { injectable } from "inversify";
import { ISqlBaseRepository } from "./i-sql-base-repository.js";

@injectable()
export class SqlBaseRepository<T extends ObjectLiteral> implements ISqlBaseRepository<T> {
  protected repo: Repository<T>;

  constructor(entity: { new (): T }, dataSource: DataSource) {
    this.repo = dataSource.getRepository(entity);
  }
  async findOne(where: Partial<T>): Promise<T | null> {
    try {
      return await this.repo.findOne({ where });
    } catch (error) {
      return null
    }
  }

  async findAll(where: Partial<T> = {}): Promise<T[]| null> {
    try {
      return await this.repo.find({ where });
    } catch (error) {
      return null
    }
  }

  async create(data: DeepPartial<T>): Promise<T | null> {
    try {
      const entity = this.repo.create(data);
      return await this.repo.save(entity);
    } catch (error) {
      console.log("create",error);
      
      return null
    }
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    try {
      await this.repo.update(id, data);
      return await this.repo.findOne({ where: { id } as any });
    } catch (error) {
      return null
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
     const result = await this.repo.delete(id);
     return !!result;
    } catch (error) {
      return false
    }
  }

async findById(id: string): Promise<T | null> {
  try {
    return await this.repo.findOne({ where: { id } as any });
  } catch (error) {
    return null
  }
}
}
