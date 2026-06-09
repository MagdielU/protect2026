import React, { useEffect, useState, useRef } from "react";
import { Container, Row, Col, Card, Spinner, Form, Button } from "react-bootstrap";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell 
} from "recharts";
import { supabase } from "../database/supabaseconfi";
import * as XLSX from 'xlsx';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";

export default function Inicio() {
  // 1. Estados de la aplicación
  const [cargando, setCargando] = useState(true);
  const [fechaDesde, setFechaDesde] = useState(
    new Date().toLocaleDateString("en-CA", { timeZone: "America/Managua" })
  );
  const [fechaHasta, setFechaHasta] = useState(
    new Date().toLocaleDateString("en-CA", { timeZone: "America/Managua" })
  );
  const [estadisticas, setEstadisticas] = useState({
    totalVentas: 0,
    ventasEfectivo: 0,
    ventasTarjeta: 0,
    productosVendidos: 0,
    montoProductos: 0,
    cantidadVentas: 0,
    ventasPorHora: [],
    ventasPorCategoria: []
  });

  // Referencias para capturar los contenedores de los gráficos
  const graficoHoraRef = useRef(null);
  const graficoCategoriaRef = useRef(null);

  // Colores para el gráfico de pastel (PieChart)
  const COLORES = ["#5e26b2", "#39ff95", "#ff6bc6", "#8b46ff", "#00d4ff", "#ffd93d"];

  // 2. useEffect para escuchar el cambio de fechas
  useEffect(() => {
    cargarDatos(fechaDesde, fechaHasta);
  }, [fechaDesde, fechaHasta]);

  // 3. Método para cargar datos desde Supabase
  const cargarDatos = async (desde, hasta) => {
    try {
      setCargando(true);
      const inicioRango = `${desde} 00:00:00`;
      const finRango = `${hasta} 23:59:59`;

      // Petición a la tabla "ventas"
      const { data: ventas, error } = await supabase
        .from("ventas")
        .select("id_venta, total, fecha_venta, metodo_pago")
        .gte("fecha_venta", inicioRango)
        .lte("fecha_venta", finRango);

      if (error) throw error;

      const idsVentas = ventas?.map(v => v.id_venta) || [];
      let productosVendidosTemp = 0;
      let montoProductosTemp = 0;
      let ventasPorCategoriaTemp = [];

      // Si hay ventas, buscamos sus detalles relacionando productos y categorías
      if (idsVentas.length > 0) {
        const { data: detalles, error: errorDetalles } = await supabase
          .from("detalles_ventas")
          .select(`
            cantidad,
            subtotal,
            productos (
              nombre_producto,
              categorias (
                nombre_categoria
              )
            )
          `)
          .in("id_venta", idsVentas);

        if (errorDetalles) throw errorDetalles;

        detalles?.forEach(d => {
          productosVendidosTemp += d.cantidad || 0;
          montoProductosTemp += d.subtotal || 0;

          const categoria = d.productos?.categorias?.nombre_categoria || "Sin categoría";
          const existente = ventasPorCategoriaTemp.find(c => c.name === categoria);

          if (existente) {
            existente.value += d.subtotal || 0;
          } else {
            ventasPorCategoriaTemp.push({ name: categoria, value: d.subtotal || 0 });
          }
        });

        // Ordenar categorías de mayor a menor venta
        ventasPorCategoriaTemp.sort((a, b) => b.value - a.value);
      }

      // Cálculos de totales utilizando reduce y filter
      const totalVentas = ventas?.reduce((sum, v) => sum + (v.total || 0), 0) || 0;
      const ventasEfectivo = ventas?.filter(v => v.metodo_pago === "efectivo").reduce((sum, v) => sum + (v.total || 0), 0) || 0;
      const ventasTarjeta = ventas?.filter(v => v.metodo_pago === "tarjeta").reduce((sum, v) => sum + (v.total || 0), 0) || 0;

      // Procesamiento de ventas agrupadas por Hora
      const horaMap = Array(24).fill(0);
      ventas?.forEach(venta => {
        if (!venta.fecha_venta) return;
        const hora = new Date(venta.fecha_venta).getHours();
        if (hora >= 0 && hora < 24) {
          horaMap[hora] += venta.total || 0;
        }
      });

      const ventasPorHoraTemp = [];
      let acumulado = 0;
      // Filtro del rango horario comercial (8 AM a 10 PM)
      for (let h = 8; h <= 22; h++) {
        acumulado += horaMap[h];
        ventasPorHoraTemp.push({
          hora: `${h.toString().padStart(2, "0")}:00`,
          total: Math.round(acumulado)
        });
      }

      // Guardar todo en el estado estructurado
      setEstadisticas({
        totalVentas,
        ventasEfectivo,
        ventasTarjeta,
        productosVendidos: productosVendidosTemp,
        montoProductos: montoProductosTemp,
        cantidadVentas: ventas?.length || 0,
        ventasPorHora: ventasPorHoraTemp,
        ventasPorCategoria: ventasPorCategoriaTemp
      });

    } catch (err) {
      console.error("Error al cargar estadísticas:", err);
    } finally {
      setCargando(false);
    }
  };

  // 4. Método para exportar reportes de Excel utilizando la librería 'xlsx'
  const descargarExcel = async () => {
    try {
      setCargando(true);
      const inicioRango = `${fechaDesde} 00:00:00`;
      const finRango = `${fechaHasta} 23:59:59`;

      // Obtener datos de Ventas
      const { data: ventas, error: errorVentas } = await supabase
        .from("ventas")
        .select("id_venta, fecha_venta, total, metodo_pago, id_empleado, id_cliente")
        .gte("fecha_venta", inicioRango)
        .lte("fecha_venta", finRango)
        .order("fecha_venta", { ascending: false });

      if (errorVentas) throw errorVentas;

      // Obtener detalles de esas Ventas
      const idsVentas = ventas?.map(v => v.id_venta) || [];
      let detallesVenta = [];

      if (idsVentas.length > 0) {
        const { data: detalles, error: errorDetalles } = await supabase
          .from("detalles_ventas")
          .select("id_detalle, id_venta, cantidad, precio_unitario, subtotal, id_producto")
          .in("id_venta", idsVentas)
          .order("id_venta");

        if (errorDetalles) {
          console.error("Error en detalles:", errorDetalles);
        } else {
          detallesVenta = detalles || [];
        }
      }

      // Crear el libro de trabajo Excel vacío
      const wb = XLSX.utils.book_new();

      // Añadir Hoja de Ventas
      if (ventas && ventas.length > 0) {
        const wsVentas = XLSX.utils.json_to_sheet(ventas);
        XLSX.utils.book_append_sheet(wb, wsVentas, "Ventas");
      } else {
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([{ Mensaje: "No hay ventas en este rango" }]), "Ventas");
      }

      // Añadir Hoja de Detalles
      if (detallesVenta && detallesVenta.length > 0) {
        const wsDetalles = XLSX.utils.json_to_sheet(detallesVenta);
        XLSX.utils.book_append_sheet(wb, wsDetalles, "Detalles_Ventas");
      } else {
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([{ Mensaje: "No hay detalles de ventas" }]), "Detalles_Ventas");
      }

      // Guardar y descargar archivo en el navegador
      XLSX.writeFile(wb, `Reporte_Ventas_${fechaDesde}_a_${fechaHasta}.xlsx`);

    } catch (err) {
      console.error("Error generando Excel:", err);
      alert("Error al generar el Excel. Revisa la consola.");
    } finally {
      setCargando(false);
    }
  };

  // 4.1. Método optimizado para generar reporte general en PDF con tipografía Times
  const generarPdfGeneral = async () => {
    try {
      const pdf = new jsPDF("p", "mm", "a4");
      
      // Configuración inicial de fuente (Times New Roman) y colores ajustados
      const colorPrincipal = "#1a365d"; // Azul ejecutivo oscuro
      const colorTexto = "#2d3748";      // Gris oscuro elegante para lectura
      
      // --- PÁGINA 1: Títulos, Ventas por Hora y Resumen ---
      pdf.setFont("times", "bold");
      pdf.setFontSize(20);
      pdf.setTextColor(colorPrincipal);
      pdf.text("Reporte Estadístico General de Ventas", 14, 15);
      
      pdf.setFont("times", "normal");
      pdf.setFontSize(11);
      pdf.setTextColor(colorTexto);
      pdf.text(`Periodo analizado: ${fechaDesde} hasta ${fechaHasta}`, 14, 23);
      
      // Renderizar Gráfico 1: Ventas por Hora
      const canvasHora = await html2canvas(graficoHoraRef.current, { scale: 2 });
      const imgHora = canvasHora.toDataURL("image/png");
      pdf.addImage(imgHora, "PNG", 10, 28, 190, 75);
      
      // Sección de Resumen General
      pdf.setFont("times", "bold");
      pdf.setFontSize(14);
      pdf.setTextColor(colorPrincipal);
      pdf.text("Resumen General de Métricas", 14, 115);
      
      pdf.setFont("times", "normal");
      pdf.setFontSize(11);
      pdf.setTextColor(colorTexto);
      
      const datosResumen = [
        `Total Ventas Netas: C$ ${estadisticas.totalVentas.toFixed(2)}`,
        `Ventas en Efectivo: C$ ${estadisticas.ventasEfectivo.toFixed(2)}`,
        `Ventas con Tarjeta: C$ ${estadisticas.ventasTarjeta.toFixed(2)}`,
        `Volumen de Productos Vendidos: ${estadisticas.productosVendidos}`,
        `Cantidad de Transacciones Realizadas: ${estadisticas.cantidadVentas}`
      ];
      
      let posicionY = 123;
      datosResumen.forEach(linea => {
        pdf.text(linea, 14, posicionY);
        posicionY += 7;
      });
      
      // --- PÁGINA 2: Gráfico de Categorías y Tabla ---
      pdf.addPage();
      
      pdf.setFont("times", "bold");
      pdf.setFontSize(14);
      pdf.setTextColor(colorPrincipal);
      pdf.text("Distribución de Ventas por Categoría", 14, 15);
      
      // Renderizar Gráfico 2: Ventas por Categoría
      const canvasCat = await html2canvas(graficoCategoriaRef.current, { scale: 2 });
      const imgCat = canvasCat.toDataURL("image/png");
      pdf.addImage(imgCat, "PNG", 10, 20, 190, 75);
      
      pdf.setFont("times", "bold");
      pdf.setFontSize(14);
      pdf.setTextColor(colorPrincipal);
      pdf.text("Desglose Cronológico de Ingresos", 14, 105);
      
      // Estructura de la Tabla de Ventas por Hora
      const filas = estadisticas.ventasPorHora.map(item => [
        item.hora,
        `C$ ${item.total}`
      ]);
      
      autoTable(pdf, {
        startY: 110,
        head: [["Intervalo Horario", "Monto Acumulado"]],
        body: filas,
        styles: {
          font: "times",
          fontSize: 10,
          textColor: colorTexto
        },
        headStyles: {
          fillColor: colorPrincipal,
          fontStyle: "bold",
          textColor: "#ffffff"
        },
        alternateRowStyles: {
          fillColor: "#f7fafc"
        }
      });
      
      // Guardado dinámico con zona horaria local
      const fechaActual = new Date().toLocaleDateString("en-CA", { timeZone: "America/Managua" });
      pdf.save(`Reporte_General_${fechaDesde}_${fechaHasta}_${fechaActual}.pdf`);
      
    } catch (error) {
      console.error("Error compilando el documento PDF:", error);
      alert("Ocurrió un inconveniente al generar el reporte en PDF.");
    }
  };

  // 5. Retorno condicional si está cargando datos
  if (cargando) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" variant="primary" size="lg" />
        <p className="mt-3">Cargando estadísticas...</p>
      </Container>
    );
  }

  // 6. Renderizado del Dashboard principal
  return (
    <div className="mt-2">
      <div className="mb-4">
        <h2>Dashboard</h2>
        <h6>Estadísticas del Negocio</h6>
      </div>

      {/* Controles de Fechas y Botones de Descarga */}
      <Row className="mb-4">
        <Col xs={6} md={3}>
          <Form.Group>
            <Form.Label>Desde</Form.Label>
            <Form.Control 
              type="date" 
              value={fechaDesde} 
              onChange={(e) => setFechaDesde(e.target.value)} 
            />
          </Form.Group>
        </Col>
        <Col xs={6} md={3}>
          <Form.Group>
            <Form.Label>Hasta</Form.Label>
            <Form.Control 
              type="date" 
              value={fechaHasta} 
              onChange={(e) => setFechaHasta(e.target.value)} 
            />
          </Form.Group>
        </Col>
        <Col md={6} className="d-flex align-items-end gap-2 mt-3 mt-md-0">
          <Button variant="success" onClick={descargarExcel}>
            <i className="bi bi-file-earmark-excel me-2"></i>
            Descargar Excel
          </Button>
          <Button variant="outline-danger" onClick={generarPdfGeneral}>
            <i className="bi bi-file-earmark-pdf me-2"></i>
            Descargar PDF
          </Button>
        </Col>
      </Row>

      {/* Grid de Tarjetas de Resumen */}
      <Row className="g-4 mb-5">
        <Col md={6} lg={3}>
          <Card className="h-100 text-white shadow" style={{ background: "linear-gradient(135deg, #28a745, #34ce57)" }}>
            <Card.Body>
              <h5>Ventas Totales</h5>
              <h2>C$ {estadisticas.totalVentas.toFixed(2)}</h2>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} lg={3}>
          <Card className="h-100 text-white shadow" style={{ background: "linear-gradient(135deg, #0166d3, #3399ff)" }}>
            <Card.Body>
              <h5>Efectivo</h5>
              <h2>C$ {estadisticas.ventasEfectivo.toFixed(2)}</h2>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} lg={3}>
          <Card className="h-100 text-white shadow" style={{ background: "linear-gradient(135deg, #5ea5f1, #94c0ec)" }}>
            <Card.Body>
              <h5>Tarjeta</h5>
              <h2>C$ {estadisticas.ventasTarjeta.toFixed(2)}</h2>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} lg={3}>
          <Card className="h-100 text-white shadow" style={{ background: "linear-gradient(135deg, #e27d01, #ffa500)" }}>
            <Card.Body>
              <h5>Productos Vendidos</h5>
              <h2>{estadisticas.productosVendidos}</h2>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Sección de Visualización de Gráficos */}
      <Row className="g-4">
        {/* Gráfico de Ventas por Hora (Líneas) */}
        <Col lg={8}>
          <Card className="shadow border-0">
            <Card.Body ref={graficoHoraRef}>
              <h5 className="mb-3">Ventas por Hora</h5>
              <ResponsiveContainer width="100%" height={360}>
                <LineChart data={estadisticas.ventasPorHora}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hora" />
                  <YAxis tickFormatter={(v) => `C$ ${v}`} />
                  <Tooltip formatter={(v) => [`C$ ${v}`, "Monto"]} />
                  <Line type="monotone" dataKey="total" stroke="#5e26b2" strokeWidth={4} dot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>

        {/* Gráfico de Ventas por Categoría (Pastel/Dona) */}
        <Col lg={4}>
          <Card className="shadow border-0">
            <Card.Body ref={graficoCategoriaRef}>
              <h5 className="mb-3">Ventas por Categoría</h5>
              <ResponsiveContainer width="100%" height={360}>
                <PieChart>
                  <Pie
                    data={estadisticas.ventasPorCategoria.length > 0 ? estadisticas.ventasPorCategoria : [{ name: "Sin datos", value: 1 }]}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={110}
                    label
                  >
                    {estadisticas.ventasPorCategoria.map((_, i) => (
                      <Cell key={`cell-${i}`} fill={COLORES[i % COLORES.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => `C$ ${v}`} />
                </PieChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}