import React from "react";
import { Table, Button, Image, Badge, Card, Row, Col } from "react-bootstrap";

const TablaProductos = ({
    productos,
    categorias,
    setProductoEditar,
    setMostrarModalEdicion,
    setProductoAEliminar,
    setMostrarModalEliminacion,
    copiarProducto,       // Corregido: Recibe la prop para copiar datos
    generarQRImagen       // Corregido: Recibe el método para abrir el QR dinámico
}) => {

    // Función para obtener el nombre de la categoría por su ID
    const obtenerNombreCategoria = (id) => {
        const categoria = categorias.find(cat => cat.id_categoria === id);
        return categoria ? categoria.nombre_categoria : "Sin categoría";
    };

    return (
        <>
            {/* ================= VISTA ESCRITORIO (TABLA TRADICIONAL) ================= */}
            <div className="d-none d-lg-block table-responsive shadow-sm rounded">
                <Table hover className="align-middle bg-white m-0">
                    <thead className="table-dark">
                        <tr>
                            <th className="text-center">Imagen</th>
                            <th>Producto</th>
                            <th>Categoría</th>
                            <th>Precio</th>
                            <th>Descripción</th>
                            <th className="text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {productos.length > 0 ? (
                            productos.map((producto) => (
                                <tr key={producto.id_producto}>
                                    <td className="text-center" style={{ width: '100px' }}>
                                        <Image
                                            src={producto.url_imagen}
                                            alt={producto.nombre_producto}
                                            rounded
                                            style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                            onError={(e) => e.target.src = 'https://via.placeholder.com/50'}
                                        />
                                    </td>
                                    <td>
                                        <div className="fw-bold">{producto.nombre_producto}</div>
                                        <small className="text-muted">ID: {producto.id_producto}</small>
                                    </td>
                                    <td>
                                        <Badge bg="info" className="text-dark">
                                            {obtenerNombreCategoria(producto.categoria_producto)}
                                        </Badge>
                                    </td>
                                    <td className="fw-bold text-success">
                                        ${parseFloat(producto.precio_venta).toFixed(2)}
                                    </td>
                                    <td className="text-truncate" style={{ maxWidth: '200px' }}>
                                        {producto.descripcion_producto || <span className="text-muted fst-italic">Sin descripción</span>}
                                    </td>
                                    <td className="text-center">
                                        <div className="d-flex justify-content-center gap-2">
                                            {/* Botón QR Dinámico (Escritorio) */}
                                            <Button
                                                variant="outline-dark"
                                                size="sm"
                                                onClick={() => generarQRImagen(producto)}
                                                title="Generar código QR"
                                            >
                                                <i className="bi bi-qr-code"></i>
                                            </Button>

                                            <Button
                                                variant="outline-warning"
                                                size="sm"
                                                onClick={() => {
                                                    setProductoEditar(producto);
                                                    setMostrarModalEdicion(true);
                                                }}
                                                title="Editar producto"
                                            >
                                                <i className="bi bi-pencil"></i>
                                            </Button>

                                            <Button
                                                variant="outline-success"
                                                size="sm"
                                                onClick={() => copiarProducto(producto)}
                                                title="Copiar producto al portapapeles"
                                            >
                                                <i className="bi bi-clipboard"></i>
                                            </Button>

                                            <Button
                                                variant="outline-danger"
                                                size="sm"
                                                onClick={() => {
                                                    setProductoAEliminar(producto);
                                                    setMostrarModalEliminacion(true);
                                                }}
                                                title="Eliminar producto"
                                            >
                                                <i className="bi bi-trash"></i>
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="text-center py-4 text-muted">
                                    No hay productos registrados en esta página.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            </div>

            {/* ================= VISTA MÓVIL (TARJETAS RESPONSIVAS) ================= */}
            <div className="d-lg-none">
                {productos.length > 0 ? (
                    <Row className="g-3">
                        {productos.map((producto) => (
                            <Col xs={12} key={producto.id_producto}>
                                <Card className="shadow-sm border-0 rounded-3">
                                    <Card.Body>
                                        <div className="d-flex align-items-center gap-3 mb-3">
                                            <Image
                                                src={producto.url_imagen}
                                                alt={producto.nombre_producto}
                                                rounded
                                                style={{ width: '65px', height: '65px', objectFit: 'cover' }}
                                                onError={(e) => e.target.src = 'https://via.placeholder.com/65'}
                                            />
                                            <div className="flex-grow-1 min-w-0">
                                                <h6 className="mb-0 text-truncate fw-bold">{producto.nombre_producto}</h6>
                                                <small className="text-muted d-block mb-1">ID: {producto.id_producto}</small>
                                                <Badge bg="info" className="text-dark">
                                                    {obtenerNombreCategoria(producto.categoria_producto)}
                                                </Badge>
                                            </div>
                                            <div className="text-end">
                                                <span className="fw-bold text-success d-block fs-5">
                                                    ${parseFloat(producto.precio_venta).toFixed(2)}
                                                </span>
                                            </div>
                                        </div>

                                        <p className="text-muted small text-truncate mb-3 bg-light p-2 rounded">
                                            {producto.descripcion_producto || <span className="fst-italic">Sin descripción</span>}
                                        </p>

                                        <div className="d-flex justify-content-end gap-2 border-top pt-2 flex-wrap">
                                            {/* Botón QR Dinámico (Móvil) */}
                                            <Button
                                                variant="outline-dark"
                                                size="sm"
                                                className="px-2"
                                                onClick={() => generarQRImagen(producto)}
                                            >
                                                <i className="bi bi-qr-code me-1"></i> QR
                                            </Button>

                                            <Button
                                                variant="warning"
                                                size="sm"
                                                className="px-2"
                                                onClick={() => {
                                                    setProductoEditar(producto);
                                                    setMostrarModalEdicion(true);
                                                }}
                                            >
                                                <i className="bi bi-pencil me-1"></i> Editar
                                            </Button>

                                            <Button
                                                variant="outline-success"
                                                size="sm"
                                                className="px-2"
                                                onClick={() => copiarProducto(producto)}
                                            >
                                                <i className="bi bi-clipboard me-1"></i> Copiar
                                            </Button>

                                            <Button
                                                variant="danger"
                                                size="sm"
                                                className="px-2"
                                                onClick={() => {
                                                    setProductoAEliminar(producto);
                                                    setMostrarModalEliminacion(true);
                                                }}
                                            >
                                                <i className="bi bi-trash me-1"></i> Eliminar
                                            </Button>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                ) : (
                    <div className="text-center py-4 text-muted bg-white shadow-sm rounded">
                        No hay productos registrados en esta página.
                    </div>
                )}
            </div>
        </>
    );
};

export default TablaProductos;