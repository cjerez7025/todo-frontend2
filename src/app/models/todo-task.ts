// src/app/models/todo-task.ts
export interface TodoTask {
  id: number;
  title: string;
  isCompleted: boolean;
  createdDate: Date;
}