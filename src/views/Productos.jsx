import React, { useEffect, useState } from "react";
import { Container, Row, Col, Button, Alert, Spinner } from "react-bootstrap";
import { supabase } from "../database/supabaseconfi";

// Importaciones para PDF
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Importación de componentes
import ModalRegistroProducto from "../components/productos/ModalRegistroProducto";
import NotificacionOperacion from "../components/NotificacionOperacion";
import CuadroBusquedas from "../components/busquedas/CuadroBusquedas";
import Paginacion from "../components/ordenamiento/Paginacion";
import TablaProductos from "../components/productos/TablaProdutos";
import ModalEliminacionProducto from "../components/productos/ModalEliminacionProducto";
import ModalEdicionProducto from "../components/productos/ModalEdicionProducto";
import ModalQRProducto from "../components/productos/ModalQRProducto";

const Productos = () => {
    const [productos, setProductos] = useState([]);
    const [productosFiltrados, setProductosFiltrados] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [textoBusqueda, setTextoBusqueda] = useState("");
    const [cargando, setCargando] = useState(true);

    const [mostrarModal, setMostrarModal] = useState(false);
    const [mostrarModalEliminacion, setMostrarModalEliminacion] = useState(false);
    const [mostrarModalEdicion, setMostrarModalEdicion] = useState(false);

    const [nuevoProducto, setNuevoProducto] = useState({
        nombre_producto: "",
        descripcion_producto: "",
        categoria_producto: "",
        precio_venta: "",
        archivo: null,
    });

    const [productoEditar, setProductoEditar] = useState({
        id_producto: "",
        nombre_producto: "",
        descripcion_producto: "",
        categoria_producto: "",
        precio_venta: "",
        url_imagen: "",
        archivo: null,
    });

    const [productoQR, setProductoQR] = useState(null);
    const [mostrarModalQR, setMostrarModalQR] = useState(false);

    const generarQRImagen = (producto) => {
        setProductoQR(producto);
        setMostrarModalQR(true);
    };

    const [productoAEliminar, setProductoAEliminar] = useState(null);
    const [toast, setToast] = useState({ mostrar: false, mensaje: "", tipo: "" });

    // Estados de Paginación
    const [paginaActual, setPaginaActual] = useState(1);
    const [registrosPorPagina, setRegistrosPorPagina] = useState(10);

    // Manejadores de Inputs
    const manejoCambioInput = (e) => {
        const { name, value } = e.target;
        setNuevoProducto((prev) => ({ ...prev, [name]: value }));
    };

    const manejoCambioArchivo = (e) => {
        const archivo = e.target.files[0];
        if (archivo && archivo.type.startsWith("image/")) {
            setNuevoProducto((prev) => ({ ...prev, archivo }));
        } else {
            alert("Selecciona una imagen válida (JPG, PNG, etc.)");
        }
    };

    const manejarBusqueda = (e) => {
        setTextoBusqueda(e.target.value);
    };

    const obtenerNombreCategoria = (id) => {
        const categoria = categorias.find(cat => cat.id_categoria === id);
        return categoria ? categoria.nombre_categoria : "Sin categoría";
    };

    // Carga de Datos desde Supabase
    const cargarCategorias = async () => {
        try {
            const { data, error } = await supabase
                .from("categorias")
                .select("*")
                .order("id_categoria", { ascending: true });

            if (error) throw error;
            setCategorias(data || []);
        } catch (err) {
            console.error("Error al cargar categorías:", err);
        }
    };

    const cargarProductos = async () => {
        try {
            setCargando(true);
            const { data, error } = await supabase
                .from("productos")
                .select("*")
                .order("id_producto", { ascending: false });

            if (error) throw error;
            setProductos(data || []);
        } catch (err) {
            console.error("Error al cargar productos:", err);
        } finally {
            setCargando(false);
        }
    };

    // Función para Agregar Producto
    const agregarProducto = async () => {
        try {
            if (
                !nuevoProducto.nombre_producto.trim() ||
                !nuevoProducto.categoria_producto ||
                !nuevoProducto.precio_venta ||
                !nuevoProducto.archivo
            ) {
                setToast({
                    mostrar: true,
                    mensaje: "Completa los campos obligatorios (nombre, categoría, precio e imagen)",
                    tipo: "advertencia",
                });
                return;
            }

            setMostrarModal(false);

            const nombreArchivo = `${Date.now()}_${nuevoProducto.archivo.name}`;

            const { error: uploadError } = await supabase.storage
                .from("imagenes_productos")
                .upload(nombreArchivo, nuevoProducto.archivo);

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
                .from("imagenes_productos")
                .getPublicUrl(nombreArchivo);

            const urlPublica = urlData.publicUrl;

            const { error } = await supabase.from("productos").insert([
                {
                    nombre_producto: nuevoProducto.nombre_producto,
                    descripcion_producto: nuevoProducto.descripcion_producto || null,
                    categoria_producto: nuevoProducto.categoria_producto,
                    precio_venta: parseFloat(nuevoProducto.precio_venta),
                    url_imagen: urlPublica,
                },
            ]);

            if (error) throw error;

            setNuevoProducto({
                nombre_producto: "",
                descripcion_producto: "",
                categoria_producto: "",
                precio_venta: "",
                archivo: null,
            });

            setToast({ mostrar: true, mensaje: "Producto registrado correctamente", tipo: "exito" });
            cargarProductos();

        } catch (err) {
            console.error("Error al agregar producto:", err);
            setToast({ mostrar: true, mensaje: "Error al registrar producto", tipo: "error" });
        }
    };

    // Generar PDF
    const generarPDFGeneral = async () => {
        if (productosFiltrados.length === 0) {
            setToast({ mostrar: true, mensaje: "No hay productos para exportar.", tipo: "advertencia" });
            return;
        }

        // Mostrar un aviso temporal o cambiar estado si la descarga tarda un poco
        setToast({ mostrar: true, mensaje: "Procesando imágenes y generando PDF...", tipo: "info" });

        // Función auxiliar para convertir URL a Base64 de forma segura
        const mapearImagenABase64 = (url) => {
            return new Promise((resolve) => {
                const img = new window.Image();
                img.crossOrigin = "Anonymous"; // Evita bloqueos de CORS de Supabase Storage
                img.src = url;
                img.onload = () => {
                    const canvas = document.createElement("canvas");
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext("2d");
                    ctx.drawImage(img, 0, 0);
                    resolve(canvas.toDataURL("image/jpeg"));
                };
                img.onerror = () => {
                    // Si la imagen falla o no existe, retorna null
                    resolve(null);
                };
            });
        };

        try {
            // 1. Convertimos todas las imágenes en paralelo antes de armar el PDF
            const imagenesBase64 = await Promise.all(
                productosFiltrados.map(prod => prod.url_imagen ? mapearImagenABase64(prod.url_imagen) : Promise.resolve(null))
            );

            const doc = new jsPDF();
            doc.setFontSize(18);
            doc.text("Reporte General de Productos", 14, 20);
            doc.setFontSize(10);
            doc.text(`Fecha de impresión: ${new Date().toLocaleDateString()}`, 14, 26);
            doc.line(14, 28, 195, 28);

            // 2. Mapeamos las filas. Dejamos la primera columna vacía "" para que sirva de contenedor a la imagen
            const filasTabla = productosFiltrados.map((prod, index) => [
                "", // Columna 0: Espacio reservado para la Imagen
                prod.id_producto,
                prod.nombre_producto,
                obtenerNombreCategoria(prod.categoria_producto),
                `$${parseFloat(prod.precio_venta).toFixed(2)}`,
                prod.descripcion_producto || "Sin descripción"
            ]);

            autoTable(doc, {
                startY: 34,
                head: [["Imagen", "ID", "Producto", "Categoría", "Precio", "Descripción"]],
                body: filasTabla,
                theme: "striped",
                headStyles: { fillColor: [0, 123, 255], halign: 'center' },
                styles: { valign: 'middle' },
                columnStyles: {
                    0: { cellWidth: 25, halign: 'center' }, // Ancho fijo para la columna de la imagen
                    1: { cellWidth: 15 },
                    4: { fontStyle: 'bold' }
                },
                rowPageBreak: 'avoid', // Evita que una fila se parta a la mitad entre páginas
                didDrawCell: (data) => {
                    // Verificamos si estamos en el cuerpo de la tabla y específicamente en la columna 0 (Imagen)
                    if (data.section === 'body' && data.column.index === 0) {
                        const rowIndex = data.row.index;
                        const base64Img = imagenesBase64[rowIndex];

                        if (base64Img) {
                            // Calculamos coordenadas centrándolas un poco en la celda
                            const x = data.cell.x + 3;
                            const y = data.cell.y + 2;
                            const width = 18;
                            const height = 18;

                            // Dibujamos la imagen dentro de la celda
                            doc.addImage(base64Img, 'JPEG', x, y, width, height);
                        }
                    }
                },
                // Ajustamos el alto mínimo de la fila para que la imagen de 18x18px quepa perfectamente
                didParseCell: (data) => {
                    if (data.section === 'body') {
                        data.row.height = 22;
                    }
                },
                margin: { top: 30 }
            });

            doc.save("reporte_general_productos.pdf");
            setToast({ mostrar: true, mensaje: "PDF generado con éxito", tipo: "exito" });

        } catch (error) {
            console.error("Error al generar el PDF con imágenes:", error);
            setToast({ mostrar: true, mensaje: "Error al procesar el PDF", tipo: "error" });
        }
    };

    // Efectos de Búsqueda y Carga Inicial
    useEffect(() => {
        if (!textoBusqueda.trim()) {
            setProductosFiltrados(productos);
        } else {
            const textoLower = textoBusqueda.toLowerCase().trim();
            const filtrados = productos.filter((prod) => {
                const nombre = prod.nombre_producto?.toLowerCase() || "";
                const descripcion = prod.descripcion_producto?.toLowerCase() || "";
                const precio = prod.precio_venta?.toString() || "";
                return (
                    nombre.includes(textoLower) ||
                    descripcion.includes(textoLower) ||
                    precio.includes(textoLower)
                );
            });
            setProductosFiltrados(filtrados);
        }
        setPaginaActual(1);
    }, [textoBusqueda, productos]);

    useEffect(() => {
        cargarCategorias();
        cargarProductos();
    }, []);

    // Lógica de paginación
    const productosPaginados = productosFiltrados.slice(
        (paginaActual - 1) * registrosPorPagina,
        paginaActual * registrosPorPagina
    );

    const copiarProducto = async (producto) => {
        if (!producto) return;

        const texto = `
        ID: ${producto.id_producto}
        Producto: ${producto.nombre_producto}
        Precio: $${producto.precio || '0.00'}
        Stock: ${producto.stock ?? 0}
        Descripción: ${producto.descripcion_producto || 'Sin descripción'}`;

        try {
            await navigator.clipboard.writeText(texto);

            setToast({
                mostrar: true,
                mensaje: `Producto "${producto.nombre_producto}" copiado al portapapeles`,
                tipo: "exito",
            });
        } catch (err) {
            console.error("Error al copiar:", err);
            setToast({
                mostrar: true,
                mensaje: "No se pudo copiar al portapapeles",
                tipo: "error",
            });
        }
    };

    return (
        <Container className="mt-3">
            <Row className="align-items-center mb-3">
                <Col xs={5} sm={6} md={7}>
                    <h3 className="mb-0">
                        <i className="bi-bag-heart-fill me-2"></i> Productos
                    </h3>
                </Col>

                <Col xs={7} sm={6} md={5} className="text-end">
                    <Button
                        variant="outline-danger"
                        onClick={generarPDFGeneral}
                        className="me-2"
                        size="md"
                    >
                        <i className="bi bi-file-earmark-pdf-fill"></i>
                        <span className="d-none d-sm-inline ms-2">Exportar Todo</span>
                    </Button>

                    <Button onClick={() => setMostrarModal(true)} size="md">
                        <i className="bi-plus-lg"></i>
                        <span className="d-none d-sm-inline ms-2">Nuevo Producto</span>
                    </Button>
                </Col>
            </Row>

            <hr />

            <Row className="mb-4">
                <Col md={6} lg={5}>
                    <CuadroBusquedas
                        textoBusqueda={textoBusqueda}
                        manejarCambioBusqueda={manejarBusqueda}
                        placeholder="Buscar por nombre, descripción o precio..."
                    />
                </Col>
            </Row>

            {cargando ? (
                <div className="text-center my-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-2 text-muted">Cargando productos...</p>
                </div>
            ) : (
                <>
                    <Row>
                        <Col>
                            {productosPaginados.length > 0 ? (
                                <TablaProductos
                                    productos={productosPaginados}
                                    categorias={categorias}
                                    setProductoEditar={setProductoEditar}
                                    setMostrarModalEdicion={setMostrarModalEdicion}
                                    setProductoAEliminar={setProductoAEliminar}
                                    setMostrarModalEliminacion={setMostrarModalEliminacion}
                                    copiarProducto={copiarProducto}
                                    generarQRImagen={generarQRImagen}
                                />
                            ) : (
                                <Alert variant="info" className="text-center">
                                    No se encontraron productos disponibles.
                                </Alert>
                            )}
                        </Col>
                    </Row>

                    {productosFiltrados.length > 0 && (
                        <Paginacion
                            registrosPorPagina={registrosPorPagina}
                            totalRegistros={productosFiltrados.length}
                            paginaActual={paginaActual}
                            establecerPaginaActual={setPaginaActual}
                            establecerRegistrosPorPagina={setRegistrosPorPagina}
                            copiarProducto={copiarProducto}
                            generarQRImagen={generarQRImagen}
                        />
                    )}
                </>
                
            )}

            <ModalRegistroProducto
                mostrarModal={mostrarModal}
                setMostrarModal={setMostrarModal}
                nuevoProducto={nuevoProducto}
                manejoCambioInput={manejoCambioInput}
                manejoCambioArchivo={manejoCambioArchivo}
                agregarProducto={agregarProducto}
                categorias={categorias}
            />

            <NotificacionOperacion
                mostrar={toast.mostrar}
                mensaje={toast.mensaje}
                tipo={toast.tipo}
                onCerrar={() => setToast({ ...toast, mostrar: false })}
            />

            <ModalEdicionProducto
                mostrarModalEdicion={mostrarModalEdicion}
                setMostrarModalEdicion={setMostrarModalEdicion}
                productoEditar={productoEditar}
                setProductoEditar={setProductoEditar}
                categorias={categorias}
                cargarProductos={cargarProductos}
                setToast={setToast}
            />

            <ModalEliminacionProducto
                mostrarModalEliminacion={mostrarModalEliminacion}
                setMostrarModalEliminacion={setMostrarModalEliminacion}
                productoAEliminar={productoAEliminar}
                cargarProductos={cargarProductos}
                setToast={setToast}
            />

            <ModalQRProducto
                mostrar={mostrarModalQR}
                onHide={() => {
                    setMostrarModalQR(false);
                    setProductoQR(null);
                }}
                producto={productoQR}
            />
        </Container>
    );
};

export default Productos;