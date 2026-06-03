import React, { useState, useEffect } from "react";
import { Row, Col, Button, Spinner, Container, Alert } from "react-bootstrap";
import { supabase } from "../database/supabaseconfi";
import emailjs from '@emailjs/browser';

// Componentes de Categorías
import ModalRegistroCategoria from "../components/categorias/ModalRegistroCategoria";
import NotificacionOperacion from "../components/NotificacionOperacion";
import TablaCategorias from "../components/categorias/TablaCategorias";
import ModalEdicionCategoria from "../components/categorias/ModalEdicionCategoria";
import ModalEliminacionCategoria from "../components/categorias/ModalEliminacionCategoria";
import TarjetaCategoria from "../components/categorias/TarjetaCategoria";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ModalEnvioCorreoCategorias from "../components/categorias/ModalEnvioCorreoCategorias";

// NUEVOS COMPONENTES
// La ruta correcta hacia las carpetas reales
import CuadroBusquedas from "../components/busquedas/CuadroBusquedas";
import Paginacion from "../components/ordenamiento/Paginacion";

const Categorias = () => {

    const [toast, setToast] = useState({ mostrar: false, mensaje: "", tipo: "" });
    const [mostrarModal, setMostrarModal] = useState(false);
    const [nuevaCategoria, setNuevaCategoria] = useState({ nombre_categoria: "", descripcion_categoria: "" });
    const [categorias, setCategorias] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [mostrarModalEliminacion, setMostrarModalEliminacion] = useState(false);
    const [categoriaAEliminar, setCategoriaAEliminar] = useState(null);
    const [mostrarModalEdicion, setMostrarModalEdicion] = useState(false);
    const [categoriaEditar, setCategoriaEditar] = useState({ id_categoria: "", nombre_categoria: "", descripcion_categoria: "" });

    const [textoBusqueda, setTextoBusqueda] = useState("");
    const [categoriasFiltradas, setCategoriasFiltradas] = useState([]);
    const [registrosPorPagina, establecerRegistrosPorPagina] = useState(5);
    const [paginaActual, establecerPaginaActual] = useState(1);

    const [mostrarModalCorreo, setMostrarModalCorreo] = useState(false);
    const [emailDestino, setEmailDestino] = useState("");
    const [enviandoCorreo, setEnviandoCorreo] = useState(false);

    useEffect(() => {
        if (!textoBusqueda.trim()) {
            setCategoriasFiltradas(categorias);
        } else {
            const textoLower = textoBusqueda.toLowerCase().trim();
            const filtradas = categorias.filter(
                (cat) =>
                    cat.nombre_categoria.toLowerCase().includes(textoLower) ||
                    (cat.descripcion_categoria && cat.descripcion_categoria.toLowerCase().includes(textoLower))
            );
            setCategoriasFiltradas(filtradas);
            establecerPaginaActual(1); // Reiniciar a página 1 al buscar
        }
    }, [textoBusqueda, categorias]);

    // --- LÓGICA DE PAGINACIÓN (Cálculo de segmento) ---
    const categoriasPaginadas = categoriasFiltradas.slice(
        (paginaActual - 1) * registrosPorPagina,
        paginaActual * registrosPorPagina
    );

    const manejarBusqueda = (e) => {
        setTextoBusqueda(e.target.value);
    };

    // Inicializar EmailJS
    useEffect(() => {
        emailjs.init(import.meta.env.VITE_EMAILJS_PUBLIC_KEY);
    }, []);

    const abrirModalCorreo = () => {
        setEmailDestino("");
        setMostrarModalCorreo(true);
    };
    const formatearCategoriasParaCorreo = () => {
        if (categorias.length === 0) return "No hay categorías registradas."; let texto = `LISTADO DE CATEGORÍAS\n\n`;
        texto += `Fecha: ${new Date().toLocaleDateString("es-NI")}\n`;
        texto += `Total de categorías: ${categorias.length}\n\n`;
        categorias.forEach((cat, index) => {
            texto += `${index + 1}. ${cat.nombre_categoria}\n`;
            if (cat.descripcion_categoria) {
                texto += ` Descripción: ${cat.descripcion_categoria}\n`;
            }
            texto += `\n`;
        });
        return texto;
    };

    const enviarCorreoCategorias = () => {
        if (!emailDestino.trim()) {
            setToast({
                mostrar: true,
                mensaje: "Por favor ingresa un correo destino.",
                tipo: "advertencia",
            });
            return;
        }
        setEnviandoCorreo(true);
        const mensaje = formatearCategoriasParaCorreo();
        const templateParams = {
            to_name: "Administrador",
            user_email: emailDestino,
            message: mensaje,
            fecha_envio: new Date().toLocaleDateString("es-NI")
        };
        emailjs.send(
            import.meta.env.VITE_EMAILJS_SERVICE_ID,
            import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
            templateParams
        )
            .then(() => {
                setToast({
                    mostrar: true,
                    mensaje: "Correo enviado correctamente.",
                    tipo: "exito",
                });
                setMostrarModalCorreo(false);
                setEmailDestino("");
            })
            .catch((error) => {
                console.error("Error EmailJS:", error);
                setToast({
                    mostrar: true,
                    mensaje: "Error al enviar el correo.",
                    tipo: "error",
                });
            })
            .finally(() => {
                setEnviandoCorreo(false);
            });
    };

    // FUNCIONES ORIGINALES (CARGA, AGREGAR, EDITAR, ELIMINAR)
    const cargarCategorias = async () => {
        try {
            setCargando(true);
            const { data, error } = await supabase
                .from("categorias")
                .select("*")
                .order("id_categoria", { ascending: true });

            if (error) throw error;
            setCategorias(data || []);
        } catch (err) {
            console.error("Error:", err.message);
            setToast({ mostrar: true, mensaje: "Error al cargar categorías.", tipo: "error" });
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarCategorias();
    }, []);

    const manejoCambioInput = (e) => {
        const { name, value } = e.target;
        setNuevaCategoria((prev) => ({ ...prev, [name]: value }));
    };

    const manejoCambioInputEdicion = (e) => {
        const { name, value } = e.target;
        setCategoriaEditar((prev) => ({ ...prev, [name]: value }));
    };

    const abrirModalEdicion = (categoria) => {
        setCategoriaEditar({ ...categoria });
        setMostrarModalEdicion(true);
    };

    const abrirModalEliminacion = (categoria) => {
        setCategoriaAEliminar(categoria);
        setMostrarModalEliminacion(true);
    };

    const generarPDFGeneral = () => {
        if (categoriasFiltradas.length === 0) {
            setToast({ mostrar: true, mensaje: "No hay datos para exportar.", tipo: "advertencia" });
            return;
        }

        const doc = new jsPDF();

        // Encabezado del Reporte General
        doc.setFontSize(18);
        doc.text("Reporte General de Categorías", 14, 20);

        doc.setFontSize(10);
        doc.text(`Fecha de impresión: ${new Date().toLocaleDateString()}`, 14, 26);

        // Línea decorativa
        doc.line(14, 28, 195, 28);

        // Estructura de las filas para la tabla global
        const filasTabla = categoriasFiltradas.map(cat => [
            cat.id_categoria,
            cat.nombre_categoria,
            cat.descripcion_categoria || "Sin descripción"
        ]);

        // Generar la tabla con todos los registros juntos
        autoTable(doc, {
            startY: 34,
            head: [["ID", "Nombre de Categoría", "Descripción"]],
            body: filasTabla,
            theme: "striped", // Diseño limpio con filas alternadas
            headStyles: { fillColor: [40, 167, 69] }, // Color verde Bootstrap (success) para el encabezado
            margin: { top: 30 }
        });

        // Descargar el PDF único
        doc.save("reporte_general_categorias.pdf");
    };

    const agregarCategoria = async () => {
        if (!nuevaCategoria.nombre_categoria.trim() || !nuevaCategoria.descripcion_categoria.trim()) {
            setToast({ mostrar: true, mensaje: "Debe llenar todos los campos.", tipo: "advertencia" });
            return;
        }
        try {
            const { error } = await supabase.from("categorias").insert([nuevaCategoria]);
            if (error) throw error;
            setToast({ mostrar: true, mensaje: "Categoría registrada exitosamente.", tipo: "exito" });
            setNuevaCategoria({ nombre_categoria: "", descripcion_categoria: "" });
            setMostrarModal(false);
            cargarCategorias();
        } catch (err) {
            setToast({ mostrar: true, mensaje: "Error al registrar categoría.", tipo: "error" });
        }
    };

    const actualizarCategoria = async () => {
        try {
            const { error } = await supabase
                .from("categorias")
                .update({
                    nombre_categoria: categoriaEditar.nombre_categoria,
                    descripcion_categoria: categoriaEditar.descripcion_categoria,
                })
                .eq("id_categoria", categoriaEditar.id_categoria);

            if (error) throw error;
            setMostrarModalEdicion(false);
            cargarCategorias();
            setToast({ mostrar: true, mensaje: "Categoría actualizada exitosamente.", tipo: "exito" });
        } catch (err) {
            setToast({ mostrar: true, mensaje: "Error al actualizar categoría.", tipo: "error" });
        }
    };

    const eliminarCategoria = async () => {
        try {
            const { error } = await supabase
                .from("categorias")
                .delete()
                .eq("id_categoria", categoriaAEliminar.id_categoria);

            if (error) throw error;
            setMostrarModalEliminacion(false);
            cargarCategorias();
            setToast({ mostrar: true, mensaje: "Categoría eliminada exitosamente.", tipo: "exito" });
        } catch (err) {
            setToast({ mostrar: true, mensaje: "Error al eliminar categoría.", tipo: "error" });
        }
    };



    return (
        <Container className="mt-3">
            <Row className="align-items-center mb-3">
                <Col xs={6} sm={7}>
                    <h3 className="mb-0"><i className="bi-bookmark-plus-fill me-2"></i> Categorías</h3>
                </Col>
                <Col xs={6} sm={5} className="text-end">
                    {/* NUEVO BOTÓN GENERAL DE PDF */}
                    <Button
                        variant="outline-danger"
                        onClick={generarPDFGeneral}
                        className="me-2"
                    >
                        <i className="bi bi-file-earmark-pdf-fill"></i>
                        <span className="d-none d-sm-inline ms-2">Exportar Todo</span>
                    </Button>

                    <Button onClick={() => setMostrarModal(true)}>
                        <i className="bi-plus-lg"></i>
                        <span className="d-none d-sm-inline ms-2">Nueva Categoría</span>
                    </Button>
                </Col>
            </Row>

            <Row className="align-items-center mb-3">
                <Col xs={8} sm={8} md={8} lg={8} className="d-flex align-items-center"> <h3 className="mb-0">
                    <i className="bi-bookmark-plus-fill me-2"></i> Categorías
                </h3>
                </Col>
                <Col xs={2} sm={2} md={2} lg={2} className="text-end">
                    <Button variant="primary" onClick={abrirModalCorreo} size="md">
                        <i className="bi bi-envelope"></i>
                        <span className="d-none d-lg-inline ms-2">Enviar por Correo</span> </Button>
                </Col>
                <Col xs={2} sm={2} md={2} lg={2} className="text-end">
                    <Button
                        onClick={() => setMostrarModal(true)}
                        size="md"
                    >
                        <i className="bi-plus-lg"></i>
                        <span className="d-none d-lg-inline ms-2">Nueva Categoría</span> </Button>
                </Col>
            </Row>

            <hr />

            {/* BARRA DE BÚSQUEDA */}
            <Row className="mb-4">
                <Col md={6} lg={5}>
                    <CuadroBusquedas
                        textoBusqueda={textoBusqueda}
                        manejarCambioBusqueda={manejarBusqueda}
                        placeholder="Buscar por nombre o descripción..."
                    />
                </Col>
            </Row>

            {cargando ? (
                <Row className="text-center my-5">
                    <Col>
                        <Spinner animation="border" variant="success" />
                        <p className="mt-3 text-muted">Cargando categorías...</p>
                    </Col>
                </Row>
            ) : (
                <>
                    {/* MENSAJE SI NO HAY RESULTADOS */}
                    {textoBusqueda.trim() && categoriasFiltradas.length === 0 && (
                        <Row className="mb-4">
                            <Col>
                                <Alert variant="info" className="text-center">
                                    <i className="bi bi-info-circle me-2"></i>
                                    No se encontraron categorías que coincidan con "{textoBusqueda}".
                                </Alert>
                            </Col>
                        </Row>
                    )}

                    {/* VISTA DE DATOS (TABLA Y TARJETAS) - USANDO categoriasPaginadas */}
                    {categoriasFiltradas.length > 0 && (
                        <Row>
                            <Col lg={12} className="d-none d-lg-block">
                                <TablaCategorias
                                    categorias={categoriasPaginadas}
                                    abrirModalEdicion={abrirModalEdicion}
                                    abrirModalEliminacion={abrirModalEliminacion}
                                />
                            </Col>
                            <Col xs={12} className="d-lg-none">
                                <TablaCategorias
                                    categorias={categoriasPaginadas}
                                    abrirModalEdicion={abrirModalEdicion}
                                    abrirModalEliminacion={abrirModalEliminacion}
                                />
                            </Col>
                        </Row>
                    )}

                    {/* COMPONENTE DE PAGINACIÓN */}
                    {categoriasFiltradas.length > 0 && (
                        <Paginacion
                            registrosPorPagina={registrosPorPagina}
                            totalRegistros={categoriasFiltradas.length}
                            paginaActual={paginaActual}
                            establecerPaginaActual={establecerPaginaActual}
                            establecerRegistrosPorPagina={establecerRegistrosPorPagina}
                        />
                    )}
                </>
            )}

            {/* MODALES Y NOTIFICACIONES */}
            <ModalRegistroCategoria
                mostrarModal={mostrarModal} setMostrarModal={setMostrarModal}
                nuevaCategoria={nuevaCategoria} manejoCambioInput={manejoCambioInput}
                agregarCategoria={agregarCategoria}
            />
            <ModalEdicionCategoria
                mostrarModalEdicion={mostrarModalEdicion} setMostrarModalEdicion={setMostrarModalEdicion}
                categorLaEditar={categoriaEditar} manejoCambioInputEdicion={manejoCambioInputEdicion}
                actualizarCategoria={actualizarCategoria}
            />
            <ModalEliminacionCategoria
                mostrarModalEliminacion={mostrarModalEliminacion} setMostrarModalEliminacion={setMostrarModalEliminacion}
                eliminarCategoria={eliminarCategoria} categoria={categoriaAEliminar}
            />
            <NotificacionOperacion
                mostrar={toast.mostrar} mensaje={toast.mensaje} tipo={toast.tipo}
                onCerrar={() => setToast({ ...toast, mostrar: false })}
            />
            <ModalEnvioCorreoCategorias
                mostrarModalCorreo={mostrarModalCorreo}
                setMostrarModalCorreo={setMostrarModalCorreo}
                emailDestino={emailDestino}
                setEmailDestino={setEmailDestino}
                enviandoCorreo={enviandoCorreo}
                enviarCorreoCategorias={enviarCorreoCategorias}
                totalCategorias={categorias.length}
            />
        </Container>
    );
};

export default Categorias;