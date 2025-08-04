import { Component, OnInit } from '@angular/core';
import { VentasService, VentasResumen, TendenciaData, CoordinadoresData, ProductosPorMesResponse, EjecutivosResponse } from './services/ventas.service';
import * as Highcharts from 'highcharts';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  // Estados de la aplicación
  loading = false;
  error: string | null = null;
  vistaActual = 'general'; // 'general', 'tendencias', 'ejecutivos'
  
  // Datos del dashboard
  resumenData: VentasResumen | null = null;
  tendenciaData: TendenciaData | null = null;
  coordinadoresData: CoordinadoresData | null = null;
  productosData: ProductosPorMesResponse | null = null;
  ejecutivosData: EjecutivosResponse | null = null;
  
  // Para el selector de mes en productos
  mesSeleccionado: string = '';
  mesesDisponibles: string[] = [];
  
  // Charts de Highcharts
  private tendenciaChart: Highcharts.Chart | null = null;
  private coordinadoresChart: Highcharts.Chart | null = null;
  private productosChart: Highcharts.Chart | null = null;

  constructor(private ventasService: VentasService) {}

  ngOnInit() {
    this.cargarDatos();
  }

  async cargarDatos() {
    this.loading = true;
    this.error = null;

    try {
      // Cargar todos los datos en paralelo
      const [resumen, tendencia, coordinadores, productos, ejecutivos] = await Promise.all([
        this.ventasService.getResumen().toPromise(),
        this.ventasService.getTendencia().toPromise(),
        this.ventasService.getCoordinadores().toPromise(),
        this.ventasService.getProductosPorMes().toPromise(), // Sin mes específico = último mes
        this.ventasService.getTopEjecutivos(15).toPromise()
      ]);

      this.resumenData = resumen!;
      this.tendenciaData = tendencia!;
      this.coordinadoresData = coordinadores!;
      this.productosData = productos!;
      this.ejecutivosData = ejecutivos!;
      
      // Configurar selector de mes
      this.mesesDisponibles = productos!.mesesDisponibles;
      this.mesSeleccionado = productos!.mes;

      // Crear gráficos
      setTimeout(() => {
        this.crearGraficoTendencia();
        this.crearGraficoCoordinadores();
        this.crearGraficoProductos();
      }, 100);

    } catch (error) {
      this.error = 'Error al cargar datos. Verifique su conexión e intente nuevamente.';
      console.error('Error cargando datos:', error);
    } finally {
      this.loading = false;
    }
  }

  async cargarProductosPorMes() {
    try {
      const productos = await this.ventasService.getProductosPorMes(this.mesSeleccionado).toPromise();
      this.productosData = productos!;
      this.mesesDisponibles = productos!.mesesDisponibles;
      
      // Recrear gráfico de productos
      setTimeout(() => {
        this.crearGraficoProductos();
      }, 100);
    } catch (error) {
      console.error('Error cargando productos por mes:', error);
    }
  }

  cambiarVista(vista: string) {
    this.vistaActual = vista;
    
    // Recrear gráficos después del cambio de vista
    setTimeout(() => {
      if (vista === 'general') {
        this.crearGraficoTendencia();
        this.crearGraficoCoordinadores();
        this.crearGraficoProductos();
      } else if (vista === 'tendencias') {
        this.crearGraficoTendencia();
      }
    }, 100);
  }

  private crearGraficoTendencia() {
    if (!this.tendenciaData) return;

    const options: Highcharts.Options = {
      chart: {
        type: 'line',
        height: 400
      },
      title: {
        text: ''
      },
      xAxis: {
        categories: this.tendenciaData.labels,
        title: {
          text: 'Meses'
        }
      },
      yAxis: [{
        title: {
          text: 'Ventas',
          style: { color: '#667eea' }
        },
        labels: {
          style: { color: '#667eea' }
        }
      }, {
        title: {
          text: 'NAP (UF)',
          style: { color: '#48bb78' }
        },
        labels: {
          style: { color: '#48bb78' }
        },
        opposite: true
      }],
      series: [{
        name: 'Ventas',
        type: 'line',
        data: this.tendenciaData.ventas,
        color: '#667eea',
        marker: {
          fillColor: '#667eea',
          radius: 6
        },
        lineWidth: 3
      }, {
        name: 'NAP (UF)',
        type: 'line',
        data: this.tendenciaData.nap,
        color: '#48bb78',
        yAxis: 1,
        marker: {
          fillColor: '#48bb78',
          radius: 6
        },
        lineWidth: 3
      }] as any,
      tooltip: {
        shared: true,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#ccc',
        borderRadius: 8,
        shadow: true
      },
      legend: {
        align: 'center',
        verticalAlign: 'bottom',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 5
      },
      credits: {
        enabled: false
      }
    };

    if (this.tendenciaChart) {
      this.tendenciaChart.destroy();
    }
    this.tendenciaChart = Highcharts.chart('tendencia-chart', options);
  }

  private crearGraficoCoordinadores() {
    if (!this.coordinadoresData) return;

    const series = Object.entries(this.coordinadoresData.coordinadores).map(([nombre, datos], index) => ({
      name: nombre,
      type: 'column',
      data: datos,
      color: this.getColorByIndex(index)
    }));

    const options: Highcharts.Options = {
      chart: {
        type: 'column',
        height: 400
      },
      title: {
        text: ''
      },
      xAxis: {
        categories: this.coordinadoresData.labels,
        title: {
          text: 'Meses'
        }
      },
      yAxis: {
        title: {
          text: 'Ventas'
        }
      },
      series: series as any,
      plotOptions: {
        column: {
          stacking: 'normal',
          dataLabels: {
            enabled: false
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#ccc',
        borderRadius: 8
      },
      legend: {
        align: 'center',
        verticalAlign: 'bottom'
      },
      credits: {
        enabled: false
      }
    };

    if (this.coordinadoresChart) {
      this.coordinadoresChart.destroy();
    }
    this.coordinadoresChart = Highcharts.chart('coordinadores-chart', options);
  }

  private crearGraficoProductos() {
    if (!this.productosData) return;

    const chartData = this.productosData.productos.map(p => ({
      name: p.nombre,
      y: p.ventas,
      porcentaje: p.porcentaje
    }));

    const options: Highcharts.Options = {
      chart: {
        type: 'pie',
        height: 450
      },
      title: {
        text: ''
      },
      tooltip: {
        pointFormat: '<b>{point.y}</b> ventas<br/><b>{point.porcentaje}%</b> del total'
      },
      plotOptions: {
        pie: {
          allowPointSelect: true,
          cursor: 'pointer',
          dataLabels: {
            enabled: true,
            format: '<b>{point.name}</b><br/>{point.porcentaje}%<br/>({point.y} ventas)',
            style: {
              fontSize: '11px',
              fontWeight: '600'
            },
            distance: 30
          },
          showInLegend: false,
          innerSize: '40%'
        }
      },
      colors: [
        '#4f46e5', '#7c3aed', '#ec4899', '#ef4444', 
        '#f59e0b', '#10b981', '#06b6d4', '#8b5cf6'
      ],
      series: [{
        type: 'pie',
        name: 'Productos',
        data: chartData
      }] as any,
      credits: {
        enabled: false
      }
    };

    if (this.productosChart) {
      this.productosChart.destroy();
    }
    this.productosChart = Highcharts.chart('productos-chart', options);
  }

  private getColorByIndex(index: number): string {
    const colors = [
      '#667eea', '#764ba2', '#f093fb', '#f5576c',
      '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
      '#ffecd2', '#fcb69f', '#a8edea', '#fed6e3'
    ];
    return colors[index % colors.length];
  }

  formatearMes(mes: string): string {
    const meses: { [key: string]: string } = {
      'enero': 'Enero',
      'febrero': 'Febrero', 
      'marzo': 'Marzo',
      'abril': 'Abril',
      'mayo': 'Mayo',
      'junio': 'Junio',
      'julio': 'Julio'
    };
    return meses[mes] || mes;
  }

  formatNumber(num: number): string {
    return new Intl.NumberFormat('es-CL').format(num);
  }

  getTopEjecutivos(): any[] {
    if (!this.ejecutivosData?.ejecutivos) return [];
    return this.ejecutivosData.ejecutivos.slice(0, 3);
  }

  getRestEjecutivos(): any[] {
    if (!this.ejecutivosData?.ejecutivos) return [];
    return this.ejecutivosData.ejecutivos.slice(3);
  }

  getMedalIcon(posicion: number): string {
    switch(posicion) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '';
    }
  }

  getNapPorMes(): { mes: string, nap: number }[] {
    if (!this.tendenciaData) return [];
    
    return this.tendenciaData.labels.map((mes, index) => ({
      mes: mes,
      nap: this.tendenciaData!.nap[index]
    }));
  }

  getColorForMonth(index: number): string {
    const colors = [
      'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', 
      'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
    ];
    return colors[index % colors.length];
  }

  async recargarDatos() {
    await this.cargarDatos();
  }
}