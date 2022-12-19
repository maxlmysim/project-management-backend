import { ITaskResponse } from './taskTypes';

export type IColumn = {
  title: string;
  order: number;
};

export type IColumnsSet = Pick<IColumnResponse, '_id' | 'order'>;

export interface IColumnResponse extends IColumn {
  _id: string;
  boardId: string;
  tasks: ITaskResponse[];
}
