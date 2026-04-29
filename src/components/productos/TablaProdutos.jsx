import React from "react";
import { Table, Button, Image, Badge } from "react-bootstrap";

const TablaProductos = ({ 
    productos, 
    categorias, 
    setProductoEditar, 
    setMostrarModalEdicion, 
    setProductoAEliminar, 
    setMostrarModalEliminacion 
}) => {

    // Función para obtener el nombre de la categoría por su ID
    const obtenerNombreCategoria = (id) => {
        const categoria = categorias.find(cat => cat.id_categoria === id);
        return categoria ? categoria.nombre_categoria : "Sin categoría";
    };

    return (
        <div className="table-responsive shadow-sm rounded">
            <Table hover className="align-middle bg-white">
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
                                    {producto.descripcion_producto || <span className="text-muted italic">Sin descripción</span>}
                                </td>
                                <td className="text-center">
                                    <div className="d-flex justify-content-center gap-2">
                                        <Button 
                                            variant="outline-warning" 
                                            size="sm"
                                            onClick={() => {
                                                setProductoEditar(producto);
                                                setMostrarModalEdicion(true);
                                            }}
                                        >
                                            <i className="bi bi-pencil"></i>
                                        </Button>
                                        <Button 
                                            variant="outline-danger" 
                                            size="sm"
                                            onClick={() => {
                                                setProductoAEliminar(producto);
                                                setMostrarModalEliminacion(true);
                                            }}
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
    );
};

export default TablaProductos;