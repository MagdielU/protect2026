import React, { useState } from "react";
import { Container, Row, Col, Button } from "react-bootstrap";
import { supabase } from "../database/supabaseconfi";
import ModalRegistroCategoria from "../components/categorias/ModalRegistroCategoria";
import NotificacionOperacion from "../components/NotificacionOperacion";


const Categorias = () => {
    const [toast, setToast] = useState({ mostrar: false, mensaje: "", tipo: "" });
    const [mostrarModal, setMostrarModal] = useState(false);
    const [nuevaCategoria, setNuevaCategoria] = useState({
        nombre_categoria: "",
        descripcion_categoria: "",
    });

    const manejoCambioInput = (e) => {
        const { name, value } = e.target;
        setNuevaCategoria((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const agregarCategoria = async () => {
        try {
            if (
                !nuevaCategoria.nombre_categoria.trim() ||
                !nuevaCategoria.descripcion_categoria.trim()
            ) {
                setToast({
                    mostrar: true,
                    mensaje: "Debe llenar todos los campos.",
                    tipo: "advertencia",
                });
                return;
            }
            const { error } = await supabase.from("categorias").insert([
                {
                    nombre_categoria: nuevaCategoria.nombre_categoria,
                    descripcion_categoria: nuevaCategoria.descripcion_categoria,
                },
            ]);
            if (error) {
                console.error("Error al agregar categoría:", error.message);
                setToast({
                    mostrar: true,
                    mensaje: "Error al registrar categoría.",
                    tipo: "erroг",
                });
                return;
            }
            // Exito
            setToast({
                mostrar: true,
                mensaje: `Categoría "${nuevaCategoria.nombre_categoria}" registrada exitosamente.`,
                tipo: "exito",
            });
            // Limpiar formulario y cerrar modal
            setNuevaCategoria({ nombre_categoria: "", descripcion_categoria: " " });
            setMostrarModal(false);
        } catch (err) {
            console.error("Excepción al agregar categoría:", err.message);
            setToast({
                mostrar: true,
                mensaje: "Error inesperado al registrar categoría.",
                tipo: "error",
            });
        }
    };
     return (
        <>
            {/* Título y botón Nueva Categoria */}
            <Row className="align-items-center mb-3">
                <Col xs={9} sm={7} md={7} lg={7} className="d-flex align-items-center">
                    <h3 className="mb-0">
                        <i className="bi-bookmark-plus-fill me-2"></i> Categorías
                    </h3>
                </Col>
                <Col xs={3} sm={5} md={5} lg={5} className="text-end">
                    <Button onClick={() => setMostrarModal(true)} size="md">
                        <i className="bi-plus-lg"></i>
                        <span className="d-none d-sm-inline ms-2">Nueva Categoría</span>
                    </Button>
                </Col>
            </Row>

            <hr />

            {/* Modal de Registro */}
            <ModalRegistroCategoria
                mostrarModal={mostrarModal}
                setMostrarModal={setMostrarModal}
                nuevaCategoria={nuevaCategoria}
                manejoCambioInput={manejoCambioInput}
                agregarCategoria={agregarCategoria}
            />

            {/* Notificación */}
            <NotificacionOperacion
                mostrar={toast.mostrar}
                mensaje={toast.mensaje}
                tipo={toast.tipo}
                onCerrar={() => setToast({ ...toast, mostrar: false })}
            />
        </>
    );
};

export default Categorias;