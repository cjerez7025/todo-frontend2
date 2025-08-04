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

export interface ProductoData {
  nombre: string;
  ventas: number;
  porcentaje: number;
}

export interface ProductosResponse {
  productos: ProductoData[];
}

export interface ProductosPorMesResponse {
  mes: string;
  productos: ProductoData[];
  mesesDisponibles: string[];
}

export interface EjecutivoData {
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
}

export interface EjecutivosResponse {
  ejecutivos: EjecutivoData[];
}

@Injectable({
  providedIn: 'root'
})
export class VentasService {
  private apiUrl = 'https://dashboard-ventas-backend.onrender.com/api/ventas';

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

  getProductos(): Observable<ProductosResponse> {
    return this.http.get<ProductosResponse>(`${this.apiUrl}/productos`);
  }

  getProductosPorMes(mes?: string): Observable<ProductosPorMesResponse> {
    const url = mes ? `${this.apiUrl}/productos/${mes}` : `${this.apiUrl}/productos`;
    return this.http.get<ProductosPorMesResponse>(url);
  }

  getTopEjecutivos(cantidad: number = 15): Observable<EjecutivosResponse> {
    return this.http.get<EjecutivosResponse>(`${this.apiUrl}/ejecutivos/top/${cantidad}`);
  }
}