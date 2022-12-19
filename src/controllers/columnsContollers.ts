import {Request, Response} from 'express';
import * as columnService from '../services/column.service';
import {checkBody, createError} from '../services/error.service';
import * as taskService from "../services/task.service";
import * as pointService from "../services/point.service";
import {IColumnResponse} from "../types/columnTypes";
import {IPointTaskResponse} from "../types/taskTypes";


export const getColumns = async (req: Request, res: Response) => {
  const boardId = req.baseUrl.split('/')[2];
  try {
    const foundedColumns = await columnService.findColumns({boardId});
    const foundedTasks = await taskService.findTasks({boardId});
    const columns = await JSON.parse(JSON.stringify(foundedColumns))
    const columnsWithTasks = await JSON.parse(JSON.stringify(foundedColumns
      .map((column, index) => {
        column.tasks = foundedTasks
          .filter(task => task.columnId === columns[index]._id)
          .sort((task1, task2) => task1.order - task2.order)
          .map((task, index) => {
            task.order = index
            return task
          })
        return column;
      })
      .sort((column1, column2) => column1.order - column2.order)
      .map((column, index) => {
        column.order = index
        return column
      })
    ))

    const idListPoints = columnsWithTasks.map((column: IColumnResponse) => [...column.tasks.map(task => task._id)]).flat(1)

    const pointListPromise = await Promise.all(idListPoints.map(async (id: string) => await pointService.findPoints({id})))

    const pointList: IPointTaskResponse[] = await JSON.parse(JSON.stringify(pointListPromise)).flat(1)

    const columnsWithTasksAndPoints = columnsWithTasks.map((column: IColumnResponse) => {
      column.tasks.map((task)=>{
        pointList.map((point)=>{
          if(task._id === point.taskId){
            task.isDone = true
          }
        })
        return task
      })
      return column
    })

    res.json(columnsWithTasksAndPoints);
  } catch (err) {
    console.log(err);
  }
};

export const getColumnById = async (req: Request, res: Response) => {
  try {
    const foundedColumn = await columnService.findColumnById(req.params['columnId']);
    res.json(foundedColumn);
  } catch (err) {
    return res.status(404).send(createError(404, 'Column was not founded!'));
  }

};

export const createColumn = async (req: Request, res: Response) => {
  const guid = req.header('Guid') || 'undefined';
  const initUser = req.header('initUser') || 'undefined';
  const boardId = req.baseUrl.split('/')[2];
  const bodyError = checkBody(req.body, ['title', 'order'])
  if (bodyError) {
    return res.status(400).send(createError(400, "bad request: " + bodyError));
  }

  const {title, order} = req.body;

  try {
    const newColumn = await columnService.createColumn({title, order, boardId}, guid, initUser);
    res.json(newColumn);
  } catch (err) {
    return console.log(err);
  }

};

export const updateColumn = async (req: Request, res: Response) => {
  const guid = req.header('Guid') || 'undefined';
  const initUser = req.header('initUser') || 'undefined';
  const bodyError = checkBody(req.body, ['title', 'order'])
  if (bodyError) {
    return res.status(400).send(createError(400, "bad request: " + bodyError));
  }
  const {title, order} = req.body;

  try {
    const updatedColumn = await columnService.updateColumn(req.params['columnId'], {title, order}, guid, initUser)
    res.json(updatedColumn);
  } catch (err) {
    return console.log(err);
  }
};

export const deleteColumn = async (req: Request, res: Response) => {
  const guid = req.header('Guid') || 'undefined';
  const initUser = req.header('initUser') || 'undefined';
  try {
    const deletedColumn = await columnService.deleteColumnById(req.params['columnId'], guid, initUser);
    res.json(deletedColumn);
  } catch (err) {
    return console.log(err);
  }
};