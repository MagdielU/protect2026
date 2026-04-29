import React, { useEffect, useState } from "react";
import { Container, Row, Col, Button, Alert, Spinner } from "react-bootstrap";
import { supabase } from "../database/supabaseconfi";

// Importación de componentes
import ModalRegistroProducto from "../components/productos/ModalRegistroProducto";
import NotificacionOperacion from "../components/NotificacionOperacion";
import CuadroBusquedas from "../components/busquedas/CuadroBusquedas";
import Paginacion from "../components/ordenamiento/Paginacion";
import TablaProductos from "../components/productos/TablaProdutos";

const Productos = () => {
    // --- ESTADOS (Imagen edited-image.png) ---
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

    const [productoAEliminar, setProductoAEliminar] = useState(null);
    const [toast, setToast] = useState({ mostrar: false, mensaje: "", tipo: "" });

    // --- ESTADOS DE PAGINACIÓN (Basado en lógica de img 7 y 8) ---
    const [paginaActual, setPaginaActual] = useState(1);
    const [registrosPorPagina, setRegistrosPorPagina] = useState(10);

    // --- MANEJADORES (Imagen img 4.png) ---
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

    // --- CARGA DE DATOS (Imagen img 5.png) ---
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

    // --- LÓGICA DE AGREGAR (Imagen img 6.png) ---
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

    // --- EFECTOS (Imagen mig 5.png) ---
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

    // --- LÓGICA DE PAGINACIÓN ---
    const productosPaginados = productosFiltrados.slice(
        (paginaActual - 1) * registrosPorPagina,
        paginaActual * registrosPorPagina
    );

    return (
        <Container className="mt-3">
            <Row className="align-items-center mb-3">
                <Col className="d-flex align-items-center">
                    <h3 className="mb-0">
                        <i className="bi-bag-heart-fill me-2"></i> Productos
                    </h3>
                </Col>

                <Col xs={3} sm={5} md={5} lg={5} className="text-end">
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
                            {/* Visualización de la tabla */}
                            {productosPaginados.length > 0 ? (
                                <TablaProductos 
                                    productos={productosPaginados}
                                    categorias={categorias}
                                    setProductoEditar={setProductoEditar}
                                    setMostrarModalEdicion={setMostrarModalEdicion}
                                    setProductoAEliminar={setProductoAEliminar}
                                    setMostrarModalEliminacion={setMostrarModalEliminacion}
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
        </Container>
    );
};

export default Productos;