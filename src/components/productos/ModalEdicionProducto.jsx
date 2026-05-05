import React, { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { supabase } from "../../database/supabaseconfi";

const ModalEdicionProducto = ({
    mostrarModalEdicion,
    setMostrarModalEdicion,
    productoEditar,
    setProductoEditar,
    categorias,
    cargarProductos,
    setToast
}) => {

    const [archivo, setArchivo] = useState(null);

    useEffect(() => {
        setArchivo(null);
    }, [productoEditar]);

    const manejarCambio = (e) => {
        const { name, value } = e.target;
        setProductoEditar((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const manejarArchivo = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith("image/")) {
            setArchivo(file);
        } else {
            alert("Selecciona una imagen válida");
        }
    };

    const actualizarProducto = async () => {
        try {
            let urlImagen = productoEditar.url_imagen;

            // Si sube nueva imagen
            if (archivo) {
                const nombreArchivo = `${Date.now()}_${archivo.name}`;

                const { error: uploadError } = await supabase.storage
                    .from("imagenes_productos")
                    .upload(nombreArchivo, archivo);

                if (uploadError) throw uploadError;

                const { data } = supabase.storage
                    .from("imagenes_productos")
                    .getPublicUrl(nombreArchivo);

                urlImagen = data.publicUrl;
            }

            const { error } = await supabase
                .from("productos")
                .update({
                    nombre_producto: productoEditar.nombre_producto,
                    descripcion_producto: productoEditar.descripcion_producto,
                    categoria_producto: productoEditar.categoria_producto,
                    precio_venta: parseFloat(productoEditar.precio_venta),
                    url_imagen: urlImagen
                })
                .eq("id_producto", productoEditar.id_producto);

            if (error) throw error;

            setToast({
                mostrar: true,
                mensaje: "Producto actualizado correctamente",
                tipo: "exito"
            });

            setMostrarModalEdicion(false);
            cargarProductos();

        } catch (err) {
            console.error("Error al actualizar:", err);
            setToast({
                mostrar: true,
                mensaje: "Error al actualizar producto",
                tipo: "error"
            });
        }
    };

    return (
        <Modal show={mostrarModalEdicion} onHide={() => setMostrarModalEdicion(false)} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>Editar Producto</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <Form>
                    <Form.Group className="mb-2">
                        <Form.Label>Nombre</Form.Label>
                        <Form.Control
                            name="nombre_producto"
                            value={productoEditar.nombre_producto}
                            onChange={manejarCambio}
                        />
                    </Form.Group>

                    <Form.Group className="mb-2">
                        <Form.Label>Descripción</Form.Label>
                        <Form.Control
                            name="descripcion_producto"
                            value={productoEditar.descripcion_producto}
                            onChange={manejarCambio}
                        />
                    </Form.Group>

                    <Form.Group className="mb-2">
                        <Form.Label>Categoría</Form.Label>
                        <Form.Select
                            name="categoria_producto"
                            value={productoEditar.categoria_producto}
                            onChange={manejarCambio}
                        >
                            <option value="">Seleccione</option>
                            {categorias.map(cat => (
                                <option key={cat.id_categoria} value={cat.id_categoria}>
                                    {cat.nombre_categoria}
                                </option>
                            ))}
                        </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-2">
                        <Form.Label>Precio</Form.Label>
                        <Form.Control
                            type="number"
                            name="precio_venta"
                            value={productoEditar.precio_venta}
                            onChange={manejarCambio}
                        />
                    </Form.Group>

                    <Form.Group>
                        <Form.Label>Imagen</Form.Label>
                        <Form.Control type="file" onChange={manejarArchivo} />
                    </Form.Group>
                </Form>
            </Modal.Body>

            <Modal.Footer>
                <Button variant="secondary" onClick={() => setMostrarModalEdicion(false)}>
                    Cancelar
                </Button>

                <Button variant="primary" onClick={actualizarProducto}>
                    Guardar Cambios
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ModalEdicionProducto;