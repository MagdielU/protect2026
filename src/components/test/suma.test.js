//Prueba real

const suma = require('./suma');

test("La funcion suma funciona debe devolver suma correcta", () => {//Define la prueba
    expect(suma(1, 2)).toBe(3);
});
//Expect toma el resultado - tobe verefica el valor esperado