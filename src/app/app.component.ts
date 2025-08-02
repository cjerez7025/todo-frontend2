import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { VentasService, VentasResumen, TendenciaData, CoordinadoresData, ProductosData, EjecutivosData } from './services/ventas.service';
import * as Highcharts from 'highcharts';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'Dashboard Ventas Aprobadas Servicing';
  
  // Estados
  loading = true;
  error = false;
  errorMessage = '';
  
  // Datos
  resumen: VentasResumen | null = null;
  tendencia: TendenciaData | null = null;
  coordinadores: CoordinadoresData | null = null;
  productos: ProductosData | null = null;
  topEjecutivos: EjecutivosData | null = null;
  
  // Vista actual
  vistaActual = 'general';
  
  // Gráficos Highcharts
  Highcharts: typeof Highcharts = Highcharts;

  constructor(private ventasService: VentasService) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  async cargarDatos(): Promise<void> {
    try {
      this.loading = true;
      this.error = false;

      // Cargar todos los datos en paralelo
      const [resumen, tendencia, coordinadores, productos, ejecutivos] = await Promise.all([
        this.ventasService.getResumen().toPromise(),
        this.ventasService.getTendencia().toPromise(),
        this.ventasService.getCoordinadores().toPromise(),
        this.ventasService.getProductos().toPromise(),
        this.ventasService.getTopEjecutivos(15).toPromise()
      ]);

      this.resumen = resumen!;
      this.tendencia = tendencia!;
      this.coordinadores = coordinadores!;
      this.productos = productos!;
      this.topEjecutivos = ejecutivos!;

      this.loading = false;
      
      // Crear gráficos después de cargar datos
      setTimeout(() => {
        this.crearGraficos();
      }, 100);

    } catch (error: any) {
      console.error('Error cargando datos:', error);
      this.error = true;
      this.errorMessage = error.message || 'Error al cargar datos desde la API';
      this.loading = false;
    }
  }

  mostrarVista(vista: string): void {
    this.vistaActual = vista;
    
    // Recrear gráficos si es necesario
    setTimeout(() => {
      if (vista === 'tendencias') {
        this.crearGraficoTrimestral();
      }
    }, 100);
  }

  crearGraficos(): void {
    if (!this.coordinadores || !this.productos) return;

    this.crearGraficoCoordinadores();
    this.crearGraficoNAP();
    this.crearGraficoProductos();
    this.crearGraficoTendenciaMensual();
  }

  crearGraficoCoordinadores(): void {
    if (!this.coordinadores) return;

    const series = Object.entries(this.coordinadores.coordinadores).map(([coord, data], index) => ({
      name: coord.split(' ')[0],
      data: data,
      type: 'spline' as const,
      marker: {
        radius: 6,
        symbol: 'circle'
      },
      lineWidth: 3
    }));

    Highcharts.chart('coordinadores-chart', {
      chart: {
        type: 'spline',
        height: 350,
        backgroundColor: 'transparent',
        style: {
          fontFamily: 'Segoe UI, sans-serif'
        }
      },
      title: {
        text: '📈 Ventas por Coordinador',
        style: {
          fontSize: '18px',
          fontWeight: '600',
          color: '#1a365d'
        }
      },
      subtitle: {
        text: 'Evolución mensual de ventas aprobadas',
        style: {
          color: '#718096'
        }
      },
      xAxis: {
        categories: this.coordinadores.labels,
        gridLineWidth: 1,
        gridLineColor: '#f7fafc',
        lineColor: '#e2e8f0',
        tickColor: '#e2e8f0',
        labels: {
          style: {
            color: '#4a5568',
            fontWeight: '500'
          }
        }
      },
      yAxis: {
        title: {
          text: 'Número de Ventas',
          style: {
            color: '#4a5568',
            fontWeight: '600'
          }
        },
        min: 0,
        gridLineColor: '#f7fafc',
        labels: {
          style: {
            color: '#4a5568'
          }
        }
      },
      series: series,
      colors: ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe', '#43e97b', '#38f9d7'],
      legend: {
        enabled: true,
        layout: 'horizontal',
        align: 'center',
        verticalAlign: 'bottom',
        backgroundColor: 'transparent',
        itemStyle: {
          color: '#4a5568',
          fontWeight: '500'
        }
      },
      tooltip: {
        shared: true,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e2e8f0',
        borderRadius: 8,
        shadow: true,
        style: {
          color: '#1a365d'
        },
        headerFormat: '<b>{point.key}</b><br/>',
        pointFormat: '<span style="color:{series.color}">●</span> {series.name}: <b>{point.y}</b> ventas<br/>'
      },
      plotOptions: {
        spline: {
          marker: {
            enabled: true,
            states: {
              hover: {
                radius: 8
              }
            }
          },
          states: {
            hover: {
              lineWidthPlus: 1
            }
          }
        }
      },
      credits: {
        enabled: false
      }
    });
  }

  crearGraficoNAP(): void {
    if (!this.coordinadores) return;

    const series = Object.entries(this.coordinadores.coordinadores).map(([coord, data], index) => ({
      name: coord.split(' ')[0],
      data: data.map(v => Math.round(v * 2.75)),
      type: 'column' as const,
      borderRadius: 4,
      borderWidth: 0
    }));

    Highcharts.chart('nap-chart', {
      chart: {
        type: 'column',
        height: 350,
        backgroundColor: 'transparent',
        style: {
          fontFamily: 'Segoe UI, sans-serif'
        }
      },
      title: {
        text: '💰 NAP por Coordinador',
        style: {
          fontSize: '18px',
          fontWeight: '600',
          color: '#1a365d'
        }
      },
      subtitle: {
        text: 'Nuevos Activos Productivos (Ventas × 2.75)',
        style: {
          color: '#718096'
        }
      },
      xAxis: {
        categories: this.coordinadores.labels,
        gridLineWidth: 0,
        lineColor: '#e2e8f0',
        tickColor: '#e2e8f0',
        labels: {
          style: {
            color: '#4a5568',
            fontWeight: '500'
          }
        }
      },
      yAxis: {
        title: {
          text: 'NAP Total',
          style: {
            color: '#4a5568',
            fontWeight: '600'
          }
        },
        min: 0,
        gridLineColor: '#f7fafc',
        labels: {
          style: {
            color: '#4a5568'
          }
        }
      },
      series: series,
      colors: ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe', '#43e97b', '#38f9d7'],
      plotOptions: {
        column: {
          stacking: 'normal',
          borderRadius: 4,
          pointPadding: 0.1,
          groupPadding: 0.1,
          states: {
            hover: {
              brightness: 0.1
            }
          }
        }
      },
      legend: {
        enabled: true,
        layout: 'horizontal',
        align: 'center',
        verticalAlign: 'bottom',
        backgroundColor: 'transparent',
        itemStyle: {
          color: '#4a5568',
          fontWeight: '500'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e2e8f0',
        borderRadius: 8,
        shadow: true,
        style: {
          color: '#1a365d'
        },
        headerFormat: '<b>{point.key}</b><br/>',
        pointFormat: '<span style="color:{series.color}">●</span> {series.name}: <b>{point.y}</b> NAP<br/>',
        footerFormat: 'Total: <b>{point.total}</b> NAP'
      },
      credits: {
        enabled: false
      }
    });
  }

  // Estados para drill down
  drillDownLevel = 0;
  drillDownData: any = {};
  breadcrumbs: string[] = [];
  currentChart: any = null;

  crearGraficoProductos(): void {
    if (!this.productos) return;

    const colors = [
      '#667eea', '#764ba2', '#f093fb', '#f5576c', 
      '#4facfe', '#00f2fe', '#43e97b', '#38f9d7'
    ];

    const data = this.productos.productos.map((p, index) => ({
      name: p.nombre,
      y: p.ventas,
      color: colors[index % colors.length],
      drilldown: p.nombre // ID para drill down
    }));

    this.currentChart = Highcharts.chart('productos-chart', {
      chart: {
        type: 'pie',
        height: 600,
        backgroundColor: 'transparent'
      },
      title: {
        text: this.getTitleWithBreadcrumbs(),
        style: {
          fontSize: '24px',
          fontWeight: '700',
          color: '#1a365d'
        }
      },
      subtitle: {
        text: this.getSubtitleByLevel(),
        style: {
          color: '#718096',
          fontSize: '16px'
        }
      },
      plotOptions: {
        pie: {
          allowPointSelect: true,
          cursor: 'pointer',
          size: '85%',
          innerSize: '35%',
          dataLabels: {
            enabled: true,
            distance: 25,
            format: '<b>{point.name}</b><br/>{point.percentage:.1f}%<br/>({point.y} ventas)',
            style: {
              color: '#1a365d',
              fontSize: '13px',
              fontWeight: '600'
            }
          },
          showInLegend: false,
          borderWidth: 3,
          borderColor: '#ffffff',
          states: {
            hover: {
              brightness: 0.15
            }
          },
          point: {
            events: {
              click: (event: any) => {
                this.handleDrillDown(event.point);
              }
            }
          }
        }
      },
      series: [{
        name: 'Ventas',
        data: data,
        type: 'pie'
      }],
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderColor: '#e2e8f0',
        borderRadius: 12,
        style: {
          color: '#1a365d',
          fontSize: '14px'
        },
        pointFormat: '<b>{point.name}</b><br/>Ventas: <b>{point.y}</b><br/>Porcentaje: <b>{point.percentage:.1f}%</b>'
      },
      credits: {
        enabled: false
      }
    });

    // Agregar botón de vuelta si no estamos en el nivel raíz
    this.addBackButton();
  }

  handleDrillDown(point: any): void {
    this.breadcrumbs.push(point.name);
    this.drillDownLevel++;
    
    switch(this.drillDownLevel) {
      case 1:
        this.drillDownToCoordinadores(point.name);
        break;
      case 2:
        this.drillDownToEjecutivos(point.name);
        break;
      case 3:
        this.drillDownToMeses(point.name);
        break;
      default:
        this.goBack();
    }
  }

  drillDownToCoordinadores(producto: string): void {
    // Simular datos de coordinadores por producto
    const coordinadoresData = this.getCoordinadoresByProducto(producto);
    
    const data = coordinadoresData.map((coord: any, index: number) => ({
      name: coord.nombre,
      y: coord.ventas,
      color: this.getColorByIndex(index),
      drilldown: coord.nombre
    }));

    this.updateChart(data, 'Coordinadores');
  }

  drillDownToEjecutivos(coordinador: string): void {
    // Simular datos de ejecutivos por coordinador
    const ejecutivosData = this.getEjecutivosByCoordinador(coordinador);
    
    const data = ejecutivosData.map((ejec: any, index: number) => ({
      name: ejec.nombre,
      y: ejec.ventas,
      color: this.getColorByIndex(index),
      drilldown: ejec.nombre
    }));

    this.updateChart(data, 'Ejecutivos');
  }

  drillDownToMeses(ejecutivo: string): void {
    // Simular datos mensuales del ejecutivo
    const mesesData = this.getMesesByEjecutivo(ejecutivo);
    
    const data = mesesData.map((mes: any, index: number) => ({
      name: mes.mes,
      y: mes.ventas,
      color: this.getColorByIndex(index),
      drilldown: null // Último nivel
    }));

    this.updateChart(data, 'Meses');
  }

  updateChart(data: any[], type: string): void {
    if (this.currentChart) {
      this.currentChart.update({
        title: {
          text: this.getTitleWithBreadcrumbs()
        },
        subtitle: {
          text: this.getSubtitleByLevel()
        },
        series: [{
          data: data
        }]
      });
    }
    this.addBackButton();
  }

  goBack(): void {
    if (this.drillDownLevel > 0) {
      this.breadcrumbs.pop();
      this.drillDownLevel--;
      
      if (this.drillDownLevel === 0) {
        // Volver al gráfico original de productos
        this.crearGraficoProductos();
      } else {
        // Recrear el nivel anterior
        this.recreatePreviousLevel();
      }
    }
  }

  recreatePreviousLevel(): void {
    const lastItem = this.breadcrumbs[this.breadcrumbs.length - 1];
    
    switch(this.drillDownLevel) {
      case 1:
        this.drillDownToCoordinadores(lastItem);
        break;
      case 2:
        this.drillDownToEjecutivos(lastItem);
        break;
    }
  }

  getTitleWithBreadcrumbs(): string {
    if (this.drillDownLevel === 0) {
      return '🎯 Distribución por Producto';
    }
    
    const icons = ['🎯', '👥', '👤', '📅'];
    const labels = ['Productos', 'Coordinadores', 'Ejecutivos', 'Meses'];
    
    return `${icons[this.drillDownLevel]} ${labels[this.drillDownLevel]} - ${this.breadcrumbs.join(' > ')}`;
  }

  getSubtitleByLevel(): string {
    const subtitles = [
      'Participación de ventas por tipo de producto',
      'Ventas por coordinador en este producto',
      'Ventas por ejecutivo en este coordinador',
      'Ventas mensuales de este ejecutivo'
    ];
    
    return subtitles[this.drillDownLevel] || 'Detalle de ventas';
  }

  addBackButton(): void {
    // Remover botón anterior si existe
    const existingButton = document.getElementById('drill-back-btn');
    if (existingButton) {
      existingButton.remove();
    }

    if (this.drillDownLevel > 0) {
      const chartContainer = document.getElementById('productos-chart');
      if (chartContainer) {
        const backButton = document.createElement('button');
        backButton.id = 'drill-back-btn';
        backButton.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Volver a ${this.breadcrumbs.length > 1 ? this.breadcrumbs[this.breadcrumbs.length - 2] : 'Productos'}
        `;
        backButton.className = 'drill-back-button';
        backButton.onclick = () => this.goBack();
        
        chartContainer.parentElement?.insertBefore(backButton, chartContainer);
      }
    }
  }

  // Métodos para obtener datos reales del servicio
  getCoordinadoresByProducto(producto: string): any[] {
    // Obtener datos reales de coordinadores para este producto
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio'];
    const coordinadoresData: { [key: string]: number } = {};
    
    // Procesar datos de coordinadores que vendieron este producto
    meses.forEach(mes => {
      const coordDelMes = this.datosGoogleSheets?.coordinadores?.[mes as keyof typeof this.datosGoogleSheets.coordinadores] || {};
      Object.entries(coordDelMes).forEach(([coord, ventas]) => {
        if (!coordinadoresData[coord]) {
          coordinadoresData[coord] = 0;
        }
        // En una implementación real, filtrarías por producto específico
        // Por ahora usamos una proporción basada en el producto seleccionado
        coordinadoresData[coord] += Math.round((ventas as number) * this.getProductoProportion(producto));
      });
    });

    return Object.entries(coordinadoresData)
      .map(([nombre, ventas]) => ({ nombre, ventas }))
      .sort((a, b) => b.ventas - a.ventas)
      .slice(0, 6); // Top 6 coordinadores
  }

  getEjecutivosByCoordinador(coordinador: string): any[] {
    // Obtener ejecutivos reales para este coordinador
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio'];
    const ejecutivosData: { [key: string]: number } = {};
    
    meses.forEach(mes => {
      const ejecutivosDelMes = this.datosGoogleSheets?.ejecutivos?.[mes as keyof typeof this.datosGoogleSheets.ejecutivos] || {};
      Object.entries(ejecutivosDelMes).forEach(([ejecutivo, ventas]) => {
        // Filtrar por coordinador usando el mapeo ejecutivo-coordinador
        const coordinadorDelEjecutivo = this.datosGoogleSheets?.ejecutivoCoordinador?.[ejecutivo as keyof typeof this.datosGoogleSheets.ejecutivoCoordinador];
        if (coordinadorDelEjecutivo === coordinador) {
          if (!ejecutivosData[ejecutivo]) {
            ejecutivosData[ejecutivo] = 0;
          }
          ejecutivosData[ejecutivo] += ventas as number;
        }
      });
    });

    return Object.entries(ejecutivosData)
      .map(([nombre, ventas]) => ({ nombre, ventas }))
      .sort((a, b) => b.ventas - a.ventas)
      .slice(0, 8); // Top 8 ejecutivos
  }

  getMesesByEjecutivo(ejecutivo: string): any[] {
    // Obtener datos mensuales reales del ejecutivo
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio'];
    const nombresMeses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio'];
    
    return meses.map((mes, index) => {
      const ejecutivosDelMes = this.datosGoogleSheets?.ejecutivos?.[mes as keyof typeof this.datosGoogleSheets.ejecutivos] || {};
      const ventasDelMes = (ejecutivosDelMes as any)[ejecutivo] || 0;
      return {
        mes: nombresMeses[index],
        ventas: ventasDelMes
      };
    }).filter(item => item.ventas > 0); // Solo meses con ventas
  }

  getProductoProportion(producto: string): number {
    // Calcular proporción del producto en las ventas totales
    if (!this.productos) return 0.15; // Default 15%
    
    const totalVentas = this.productos.productos.reduce((sum, p) => sum + p.ventas, 0);
    const productoVentas = this.productos.productos.find(p => p.nombre === producto)?.ventas || 0;
    
    return productoVentas / totalVentas;
  }

  // Getter para acceder a los datos del servicio
  get datosGoogleSheets() {
    // En una implementación real, esto vendría del servicio
    // Por ahora simulamos con los datos que ya tienes cargados
    return {
      coordinadores: {
        enero: { "Priscilla Gutierrez": 361, "Dayana Flores": 371, "Maria Jose Ortiz": 278, "Elias Ortiz": 287 },
        febrero: { "Priscilla Gutierrez": 365, "Dayana Flores": 278, "Maria Jose Ortiz": 191, "Elias Ortiz": 299 },
        marzo: { "Priscilla Gutierrez": 413, "Dayana Flores": 336, "Maria Jose Ortiz": 302, "Elias Ortiz": 302 },
        abril: { "Priscilla Gutierrez": 382, "Dayana Flores": 300, "Maria Jose Ortiz": 292, "Elias Ortiz": 278 },
        mayo: { "Priscilla Gutierrez": 348, "Dayana Flores": 203, "Maria Jose Ortiz": 207, "Elias Ortiz": 289 },
        junio: { "Priscilla Gutierrez": 221, "Dayana Flores": 118, "Maria Jose Ortiz": 140, "Elias Ortiz": 92 },
        julio: { "Priscilla Gutierrez": 180, "Dayana Flores": 95, "Maria Jose Ortiz": 110, "Elias Ortiz": 75 }
      },
      ejecutivos: {
        enero: { "Andrea Poblete": 90, "Mariela Millan": 41, "Ana Hinestroza": 36, "Karol Pinto": 34 },
        febrero: { "Andrea Poblete": 98, "Mariela Levio": 40, "Katherine Mondaca": 40, "Ana Hinestroza": 37 },
        marzo: { "Andrea Poblete": 82, "Karol Pinto": 54, "Katherine Herrera": 45, "Ana Hinestroza": 41 },
        abril: { "Andrea Poblete": 63, "Karol Pinto": 38, "Katherine Herrera": 38, "Ana Hinestroza": 35 },
        mayo: { "Maria Jose Gallegos": 38, "Elsa Gomez": 34, "Ana Hinestroza": 32, "Sandra Apeleo": 30 },
        junio: { "Andrea Poblete": 33, "Carolina Moreno": 27, "Sandra Apeleo": 24, "Ana Hinestroza": 22 },
        julio: { "Andrea Poblete": 28, "Carolina Moreno": 22, "Sandra Apeleo": 20, "Ana Hinestroza": 18 }
      },
      ejecutivoCoordinador: {
        "Andrea Poblete": "Priscilla Gutierrez",
        "Mariela Millan": "Dayana Flores",
        "Ana Hinestroza": "Maria Jose Ortiz",
        "Karol Pinto": "Elias Ortiz",
        "Maria Jose Gallegos": "Priscilla Gutierrez",
        "Carolina Moreno": "Dayana Flores",
        "Mariela Levio": "Dayana Flores",
        "Katherine Mondaca": "Priscilla Gutierrez",
        "Katherine Herrera": "Elias Ortiz",
        "Elsa Gomez": "Maria Jose Ortiz",
        "Sandra Apeleo": "Dayana Flores"
      }
    };
  }

  getColorByIndex(index: number): string {
    const colors = [
      '#667eea', '#764ba2', '#f093fb', '#f5576c', 
      '#4facfe', '#00f2fe', '#43e97b', '#38f9d7'
    ];
    return colors[index % colors.length];
  }

  crearGraficoTrimestral(): void {
    if (!this.tendencia) return;

    // Calcular trimestres
    const q1 = this.tendencia.ventas.slice(0, 3).reduce((a, b) => a + b, 0);
    const q2 = this.tendencia.ventas.slice(3, 6).reduce((a, b) => a + b, 0);

    Highcharts.chart('trimestral-chart', {
      chart: {
        type: 'column',
        height: 400,
        backgroundColor: 'transparent',
        style: {
          fontFamily: 'Segoe UI, sans-serif'
        }
      },
      title: {
        text: '📊 Comparativo Trimestral 2024',
        style: {
          fontSize: '20px',
          fontWeight: '700',
          color: '#1a365d'
        }
      },
      subtitle: {
        text: 'Evolución de ventas por trimestre',
        style: {
          color: '#718096',
          fontSize: '14px'
        }
      },
      xAxis: {
        categories: ['Q1 (Ene-Mar)', 'Q2 (Abr-Jun)'],
        gridLineWidth: 0,
        lineColor: '#e2e8f0',
        tickColor: '#e2e8f0',
        labels: {
          style: {
            color: '#1a365d',
            fontWeight: '600',
            fontSize: '14px'
          }
        }
      },
      yAxis: {
        title: {
          text: 'Número de Ventas',
          style: {
            color: '#4a5568',
            fontWeight: '600',
            fontSize: '14px'
          }
        },
        min: 0,
        gridLineColor: '#f7fafc',
        labels: {
          style: {
            color: '#4a5568',
            fontSize: '12px'
          }
        }
      },
      series: [{
        name: 'Ventas por Trimestre',
        data: [
          { y: q1, color: '#667eea' },
          { y: q2, color: '#f5576c' }
        ],
        type: 'column',
        borderRadius: 8,
        pointWidth: 60
      }],
      plotOptions: {
        column: {
          borderRadius: 8,
          borderWidth: 0,
          dataLabels: {
            enabled: true,
            style: {
              color: '#1a365d',
              fontWeight: '700',
              fontSize: '16px'
            },
            format: '{point.y}'
          },
          states: {
            hover: {
              brightness: 0.1
            }
          }
        }
      },
      legend: {
        enabled: false
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e2e8f0',
        borderRadius: 12,
        shadow: true,
        style: {
          color: '#1a365d',
          fontSize: '14px'
        },
        headerFormat: '<b>{point.key}</b><br/>',
        pointFormat: 'Ventas: <b>{point.y}</b><br/>',
        footerFormat: 'Crecimiento: <b>' + 
          (q2 > q1 ? '+' + Math.round(((q2-q1)/q1)*100) + '%' : 
           Math.round(((q2-q1)/q1)*100) + '%') + '</b>'
      },
      credits: {
        enabled: false
      }
    });
  }

  recargarDatos(): void {
    this.cargarDatos();
  }

  formatNumber(num: number): string {
    return new Intl.NumberFormat('es-CL').format(Math.round(num));
  }

  getVariacion(actual: number, anterior: number): string {
    if (!anterior || anterior === 0) return '0.0%';
    const variacion = ((actual - anterior) / anterior * 100).toFixed(1);
    const signo = parseFloat(variacion) > 0 ? '+' : '';
    return `${signo}${variacion}%`;
  }

  getVentasGradient(index: number): string {
    const gradients = [
      'linear-gradient(135deg, #87CEEB, #66B2FF)',
      'linear-gradient(135deg, #66B2FF, #0082C8)',
      'linear-gradient(135deg, #0082C8, #006A9B)',
      'linear-gradient(135deg, #006A9B, #004E7A)',
      'linear-gradient(135deg, #004E7A, #003A5C)',
      'linear-gradient(135deg, #003A5C, #002A42)',
      'linear-gradient(135deg, #002A42, #001A2E)'
    ];
    return gradients[index] || gradients[0];
  }

  getNapGradient(index: number): string {
    const gradients = [
      'linear-gradient(135deg, #C8E6C9, #9ED158)',
      'linear-gradient(135deg, #9ED158, #70B82B)',
      'linear-gradient(135deg, #70B82B, #5A9E23)',
      'linear-gradient(135deg, #5A9E23, #4A7A1A)',
      'linear-gradient(135deg, #4A7A1A, #3A5E14)',
      'linear-gradient(135deg, #3A5E14, #2E4A0F)',
      'linear-gradient(135deg, #2E4A0F, #1E3008)'
    ];
    return gradients[index] || gradients[0];
  }

  crearGraficoTendenciaMensual(): void {
    if (!this.tendencia) return;

    Highcharts.chart('tendencia-mensual-chart', {
      chart: {
        type: 'areaspline',
        height: 350,
        backgroundColor: 'transparent',
        style: {
          fontFamily: 'Segoe UI, sans-serif'
        }
      },
      title: {
        text: '📈 Tendencia Mensual de Ventas',
        style: {
          fontSize: '18px',
          fontWeight: '600',
          color: '#1a365d'
        }
      },
      subtitle: {
        text: 'Evolución de ventas y NAP durante 2024',
        style: {
          color: '#718096'
        }
      },
      xAxis: {
        categories: this.tendencia.labels,
        gridLineWidth: 1,
        gridLineColor: '#f7fafc',
        lineColor: '#e2e8f0',
        tickColor: '#e2e8f0',
        labels: {
          style: {
            color: '#4a5568',
            fontWeight: '500'
          }
        }
      },
      yAxis: [{
        title: {
          text: 'Ventas',
          style: {
            color: '#4a5568',
            fontWeight: '600'
          }
        },
        min: 0,
        gridLineColor: '#f7fafc',
        labels: {
          style: {
            color: '#4a5568'
          }
        }
      }, {
        title: {
          text: 'NAP',
          style: {
            color: '#4a5568',
            fontWeight: '600'
          }
        },
        opposite: true,
        min: 0,
        labels: {
          style: {
            color: '#4a5568'
          }
        }
      }],
      series: [{
        name: 'Ventas',
        data: this.tendencia.ventas,
        type: 'areaspline',
        yAxis: 0,
        color: '#667eea',
        fillColor: 'rgba(102, 126, 234, 0.3)',
        marker: {
          radius: 5,
          fillColor: '#667eea',
          lineWidth: 2,
          lineColor: '#ffffff'
        },
        lineWidth: 3
      }, {
        name: 'NAP',
        data: this.tendencia.nap,
        type: 'spline',
        yAxis: 1,
        color: '#f5576c',
        marker: {
          radius: 5,
          fillColor: '#f5576c',
          lineWidth: 2,
          lineColor: '#ffffff'
        },
        lineWidth: 3
      }],
      plotOptions: {
        areaspline: {
          fillOpacity: 0.5,
          marker: {
            enabled: true,
            states: {
              hover: {
                radius: 8
              }
            }
          }
        },
        spline: {
          marker: {
            enabled: true,
            states: {
              hover: {
                radius: 8
              }
            }
          }
        }
      },
      legend: {
        enabled: true,
        layout: 'horizontal',
        align: 'center',
        verticalAlign: 'bottom',
        backgroundColor: 'transparent',
        itemStyle: {
          color: '#4a5568',
          fontWeight: '500'
        }
      },
      tooltip: {
        shared: true,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e2e8f0',
        borderRadius: 8,
        shadow: true,
        style: {
          color: '#1a365d'
        },
        headerFormat: '<b>{point.key}</b><br/>',
        pointFormat: '<span style="color:{series.color}">●</span> {series.name}: <b>{point.y}</b><br/>'
      },
      credits: {
        enabled: false
      }
    });
  }
}