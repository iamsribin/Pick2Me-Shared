import { Document, Model, FilterQuery, UpdateQuery } from 'mongoose';
import { IMongoBaseRepository } from '../mongo/i-mongo-base-repository';
import { injectable } from 'inversify';

@injectable()
export class MongoBaseRepository<T extends Document> implements IMongoBaseRepository<T> {
  private _model: Model<T>;

  constructor(model: Model<T>) {
    this._model = model;
  }

  async findById(id: string, projection: string = ''): Promise<T | null> {
    try {
      return await this._model.findById(id).select(projection).exec();
    } catch (error) {
      console.error('Error in findById:', error);
      throw error
    }
  }

  async findOne(filter: FilterQuery<T>): Promise<T | null> {
    try {
      return await this._model.findOne(filter).exec();
    } catch (error) {
      throw error
    }
  }

  async find(filter: FilterQuery<T>): Promise<T[] | null> {
    try {
      return await this._model.find(filter).exec();
    } catch (error) {
      console.error('Error in find:', error);
      throw error
    }
  }

  async create(item: Partial<T>): Promise<T | null> {
    try {
      const created = new this._model(item);
      return await created.save();
    } catch (error) {
      console.error('Error in create:', error);
      throw error
    }
  }

  async update(id: string, update: UpdateQuery<T>): Promise<T | null> {
    try {
      return await this._model.findByIdAndUpdate(id, update, { new: true }).exec();
    } catch (error) {
      console.error('Error in update:', error);
      throw error
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const result = await this._model.findByIdAndDelete(id).exec();
      return !!result;
    } catch (error) {
      console.error('Error in delete:', error);
      throw error
    }
  }

  async findMany(filter: FilterQuery<T> = {}, projection = ''): Promise<T[] | null> {
    try {
      return await this._model.find(filter, projection).lean<T[]>().exec();
    } catch (error) {
      console.error('Error in findMany:', error);
      throw error
    }
  }

  async updateOne(filter: FilterQuery<T>, update: UpdateQuery<T>): Promise<T | null> {
    try {
      return await this._model.findOneAndUpdate(filter, update, { new: true }).lean<T>().exec();
    } catch (error) {
      console.error('Error in updateOne:', error);
      throw error
    }
  }

  async deleteOne(filter: FilterQuery<T>): Promise<boolean> {
    try {
      const result = await this._model.deleteOne(filter);
      return result.deletedCount === 1;
    } catch (error) {
      console.error('Error in deleteOne:', error);
      throw error
    }
  }
}
