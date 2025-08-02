// src/app/services/ventas.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface VentasResumen {
  totalVentas: number;
  totalNap: number;
  promedioMensualVentas: number;
  promedioMensualNap: number;
  mesesProcesados: number;
  ultimaActualizacion: string;
}

export interface TendenciaData {
  labels: string[];
  ventas: number[];
  nap: number[];
}

export interface CoordinadoresData {
  labels: string[];
  coordinadores: { [key: string]: number[] };
}

export interface ProductosData {
  productos: Array<{
    nombre: string;
    ventas: number;
    porcentaje: number;
  }>;
}

export interface EjecutivosData {
  ejecutivos: Array<{
    posicion: number;
    nombre: string;
    coordinador: string;
    enero: number;
    febrero: number;
    marzo: number;
    abril: number;
    mayo: number;
    junio: number;
    julio: number;
    total: number;
    promedio: number;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class VentasService {
  private apiUrl = 'http://localhost:5025/api/ventas';

  constructor(private http: HttpClient) { }

  getResumen(): Observable<VentasResumen> {
    return this.http.get<VentasResumen>(`${this.apiUrl}/resumen`);
  }

  getTendencia(): Observable<TendenciaData> {
    return this.http.get<TendenciaData>(`${this.apiUrl}/tendencia`);
  }

  getCoordinadores(): Observable<CoordinadoresData> {
    return this.http.get<CoordinadoresData>(`${this.apiUrl}/coordinadores`);
  }

  getProductos(): Observable<ProductosData> {
    return this.http.get<ProductosData>(`${this.apiUrl}/productos`);
  }

  getTopEjecutivos(cantidad: number = 15): Observable<EjecutivosData> {
    return this.http.get<EjecutivosData>(`${this.apiUrl}/ejecutivos/top/${cantidad}`);
  }

  // Método para obtener todos los datos de una vez
  getDatosCompletos(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }
}