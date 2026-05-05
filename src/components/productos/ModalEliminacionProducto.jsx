import React from "react";
import { Modal, Button } from "react-bootstrap";
import { supabase } from "../../database/supabaseconfi";

const ModalEliminacionProducto = ({
    mostrarModalEliminacion,
    setMostrarModalEliminacion,
    productoAEliminar,
    cargarProductos,
    setToast
}) => {

    const eliminarProducto = async () => {
        try {
            if (!productoAEliminar) return;

            const { error } = await supabase
                .from("productos")
                .delete()
                .eq("id_producto", productoAEliminar.id_producto);

            if (error) throw error;

            setToast({
                mostrar: true,
                mensaje: "Producto eliminado correctamente",
                tipo: "exito"
            });

            setMostrarModalEliminacion(false);
            cargarProductos();

        } catch (err) {
            console.error("Error al eliminar:", err);
            setToast({
                mostrar: true,
                mensaje: "Error al eliminar producto",
                tipo: "error"
            });
        }
    };

    return (
        <Modal show={mostrarModalEliminacion} onHide={() => setMostrarModalEliminacion(false)}>
            <Modal.Header closeButton>
                <Modal.Title>Eliminar Producto</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                ¿Estás seguro de eliminar el producto{" "}
                <strong>{productoAEliminar?.nombre_producto}</strong>?
            </Modal.Body>

            <Modal.Footer>
                <Button variant="secondary" onClick={() => setMostrarModalEliminacion(false)}>
                    Cancelar
                </Button>

                <Button variant="danger" onClick={eliminarProducto}>
                    Eliminar
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ModalEliminacionProducto;