// src/app/services/todo.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TodoTask } from '../models/todo-task';

@Injectable({
  providedIn: 'root'
})
export class TodoService {
  private apiUrl = 'http://localhost:5025/api/todo'; // Tu API .NET

  constructor(private http: HttpClient) { }

  getTasks(): Observable<TodoTask[]> {
    return this.http.get<TodoTask[]>(this.apiUrl);
  }

  getTask(id: number): Observable<TodoTask> {
    return this.http.get<TodoTask>(`${this.apiUrl}/${id}`);
  }

  createTask(task: Partial<TodoTask>): Observable<TodoTask> {
    return this.http.post<TodoTask>(this.apiUrl, task);
  }

  updateTask(id: number, task: TodoTask): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, task);
  }

  deleteTask(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}