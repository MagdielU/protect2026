function registroProducto(producto) {
  const { nombre_producto, precio_venta, stock, descripcion } = producto || {};
  if (!nombre_producto || precio_venta === '' || stock === '') {
    return { valido: false, mensaje: "Todos los campos requeridos deben estar llenos." };
  }

  const regexNombre = /^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]+$/;
  if (!regexNombre.test(nombre_producto)) {
    return { valido: false, mensaje: "El nombre del producto solo debe contener letras." };
  }

  if (isNaN(precio_venta) || Number(precio_venta) < 0) {
    return { valido: false, mensaje: "El precio debe ser un número positivo." };
  }

  if (isNaN(stock) || Number(stock) < 0) {
    return { valido: false, mensaje: "El stock debe ser un número positivo." };
  }

  if (descripcion && descripcion.length > 255) {
    return { valido: false, mensaje: "La descripción no debe exceder 255 caracteres." };
  }
  return { valido: true };
}
module.exports = registroProducto;