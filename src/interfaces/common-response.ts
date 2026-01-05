import { StatusCode } from "./status-code.js";

export interface commonRes{
  status:StatusCode,
  message:string,
  id?:string,
  navigate?:string,
}

export interface IResponse<T> {
  status: StatusCode;
  message: string;
  navigate?: string | number;
  data?: T | null | [] | boolean;
}