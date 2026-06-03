const registroProducto = require('./registroProducto');

console.log("Prueba 1: El producto no se registra con campos vacíos");
describe("Validación de producto", () => {
    it("No permite guardar con campos vacíos", () => {
        const producto = {
            nombre_producto: '',
            id_categoria: '',
            precio_venta: '',
            stock: ''
        };

        const resultado = registroProducto(producto);
        expect(resultado.valido).toBe(false);
        expect(resultado.mensaje).toContain("campos requeridos");
    });
});

console.log("Prueba 2: El precio del producto no puede ser negativo");
describe("Validación de producto", () => {
    it("Debe rechazar precio negativo", () => {
        const producto = {
            nombre_producto: 'Martillo',
            id_categoria: '1',
            precio_venta: -10,
	        stock: 5
        };

        const resultado = registroProducto(producto);
        expect(resultado.valido).toBe(false);
        expect(resultado.mensaje).toContain("precio");
    });
});

console.log("Prueba 3: El stock debe ser mayor a cero");
it("No permite stock menor que cero", () => {
    const producto = {
        nombre_producto: "Martillo",
        id_categoria: "1",
        precio_venta: 10,
        stock: -5
    };

    const resultado = registroProducto(producto);
    expect(resultado.valido).toBe(false);
    expect(resultado.mensaje).toContain("stock");
});

console.log("Prueba 4: Descripción de producto extensa");
it("No permite descripción muy larga", () => {
    const producto = {
        nombre_producto: "Martillo",
        id_categoria: "1",
        precio_venta: 10,
        stock: 5,
        descripcion: 'a'.repeat(300) // 300 caracteres
    };

    const resultado = registroProducto(producto);
    expect(resultado.valido).toBe(false);
    expect(resultado.mensaje).toContain("descripción");
});

console.log("Prueba 5: Producto registrado correctamente");
it("Agregar producto correctamente", () => {
    const producto = {
        nombre_producto: 'Martillo',
        id_categoria: '1',
        precio_venta: 10,
        stock: 5
    };

    const resultado = registroProducto(producto);
    expect(resultado.valido).toBe(true);
});
