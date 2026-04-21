import React, { useState } from "react";
import { Modal, Form, Button } from "react-bootstrap";

const ModalEdicionCategoria = ({
    mostrarModalEdicion,
    setMostrarModalEdicion,
    categorLaEditar,
    manejoCambioInputEdicion,
    actualizarCategoria,
}) => {

    const [deshabilitado, setDeshabilitado] = useState(false);

    const handleActualizar = async () => {
        if (deshabilitado) return;
        setDeshabilitado(true);
        await actualizarCategoria();
        setDeshabilitado(false);
    };

    return (
        <Modal
            show={mostrarModalEdicion}
            onHide={() => setMostrarModalEdicion(false)}
            backdrop="static"
            keyboard={false}
            centered
        >
            <Modal.Header closeButton>
                <Modal.Title>Editar Categoria</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label>Nombre</Form.Label>
                        <Form.Control
                            type="text"
                            name="nombre_categoria"
                            value={categorLaEditar.nombre_categoria}
                            onChange={manejoCambioInputEdicion}
                            placeholder="Ingrese el nombre"
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Descripcion</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            name="descripcion_categoria"
                            value={categorLaEditar.descripcion_categoria}
                            onChange={manejoCambioInputEdicion}
                            placeholder="Ingrese la descripcion"
                        />
                    </Form.Group>
                </Form>
            </Modal.Body>

            <Modal.Footer>
                <Button
                    variant="secondary"
                    onClick={() => setMostrarModalEdicion(false)}
                >
                    Cancelar
                </Button>

                <Button
                    variant="primary"
                    onClick={handleActualizar}
                    disabled={
                        categorLaEditar.nombre_categoria.trim() === "" ||
                        deshabilitado
                    }
                >
                    Actualizar
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ModalEdicionCategoria;