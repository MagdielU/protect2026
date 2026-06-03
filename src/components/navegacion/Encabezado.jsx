import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Container, Nav, Navbar, Offcanvas } from "react-bootstrap";
import logo from "../../assets/logo.png";
import { supabase } from "../../database/supabaseconfi";
import ChatIA from "../ia/ChatIA";

const Encabezado = () => {

    const [mostrarChatIA, setMostrarChatIA] = useState(false);

    const [mostrarMenu, setMostrarMenu] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const manejarToggle = () => setMostrarMenu(!mostrarMenu);

    const manejarNavegacion = (ruta) => {
        navigate(ruta);
        setMostrarMenu(false);
    };

    const cerrarSesion = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;

            localStorage.removeItem("usuario-supabase");
            setMostrarMenu(false);
            navigate("/login");
        } catch (err) {
            console.error("Error cerrando sesión:", err.message);
        }
    };

    // Detectar rutas
    const esLogin = location.pathname === "/login";
    const esCatalogo =
        location.pathname === "/catalogo" &&
        localStorage.getItem("usuario-supabase") === null;

    // Contenido del menú
    let contenidoMenu;

    if (esLogin) {
        contenidoMenu = (
            <Nav className="ms-auto pe-2">
                <Nav.Link
                    onClick={() => manejarNavegacion("/login")}
                    className={mostrarMenu ? "color-texto-marca" : "text-white"}
                >
                    <i className="bi bi-person-fill-lock me-2"></i>
                    Iniciar sesión
                </Nav.Link>
            </Nav>
        );
    } else if (esCatalogo) {
        contenidoMenu = (
            <Nav className="ms-auto pe-2">
                <Nav.Link
                    onClick={() => manejarNavegacion("/catalogo")}
                    className={mostrarMenu ? "color-texto-marca" : "text-white"}
                >
                    <i className="bi bi-images me-2"></i>
                    <strong>Catálogo</strong>
                </Nav.Link>
            </Nav>
        );
    } else {
        contenidoMenu = (
            <Nav className="ms-auto pe-2">
                {/* Inicio */}
                <Nav.Link
                    onClick={() => manejarNavegacion("/")}
                    className={mostrarMenu ? "color-texto-marca" : "text-white"}
                >
                    {mostrarMenu && <i className="bi bi-house-fill me-2"></i>}
                    <strong>Inicio</strong>
                </Nav.Link>

                {/* Dashboard */}
                <Nav.Link
                    onClick={() => manejarNavegacion("/dashboard")}
                    className={mostrarMenu ? "color-texto-marca" : "text-white"}
                >
                    {mostrarMenu && <i className="bi bi-speedometer2 me-2"></i>}
                    <strong>Dashboard</strong>
                </Nav.Link>

                {/* Categorías */}
                <Nav.Link
                    onClick={() => manejarNavegacion("/categorias")}
                    className={mostrarMenu ? "color-texto-marca" : "text-white"}
                >
                    {mostrarMenu && <i className="bi bi-bookmark-fill me-2"></i>}
                    <strong>Categorías</strong>
                </Nav.Link>

                {/* Productos */}
                <Nav.Link
                    onClick={() => manejarNavegacion("/productos")}
                    className={mostrarMenu ? "color-texto-marca" : "text-white"}
                >
                    {mostrarMenu && <i className="bi bi-bag-heart-fill me-2"></i>}
                    <strong>Productos</strong>
                </Nav.Link>

                {/* --- NUEVA SECCIÓN: Empleados --- */}
                <Nav.Link
                    onClick={() => manejarNavegacion("/empleados")}
                    className={mostrarMenu ? "color-texto-marca" : "text-white"}
                >
                    {mostrarMenu && <i className="bi bi-person-badge-fill me-2"></i>}
                    <strong>Empleados</strong>
                </Nav.Link>

                {/* Catálogo */}
                <Nav.Link
                    onClick={() => manejarNavegacion("/catalogo")}
                    className={mostrarMenu ? "color-texto-marca" : "text-white"}
                >
                    {mostrarMenu && <i className="bi bi-images me-2"></i>}
                    <strong>Catálogo</strong>
                </Nav.Link>

                <hr />

                <Nav.Link
                    onClick={() => manejarNavegacion("/clientes")}
                    className={mostrarMenu ? "color-texto-marca" : "text-white"}
                >
                    {mostrarMenu && <i className="bi bi-people-fill me-2"></i>}
                    <strong>Clientes</strong>
                </Nav.Link>

                {/* Ventas */}
                <Nav.Link
                    onClick={() => manejarNavegacion("/ventas")}
                    className={mostrarMenu ? "color-texto-marca" : "text-white"}
                >
                    {mostrarMenu && <i className="bi bi-cart-check-fill me-2"></i>}
                    <strong>Ventas</strong>
                </Nav.Link>

                {/* Cerrar sesión (link visible en barra superior) */}
                {!mostrarMenu && (
                    <Nav.Link
                        onClick={cerrarSesion}
                        className="text-white"
                    >
                        <i className="bi bi-box-arrow-right me-2"></i>
                        Cerrar sesión

                        
                    </Nav.Link>
                )}



                {/* Info usuario y botón cerrar sesión (visible en Menú Lateral/Mobile) */}
                {mostrarMenu && (
                    <div className="mt-3 p-3 rounded bg-light text-dark">
                        <p className="mb-2">
                            <i className="bi bi-envelope-fill me-2"></i>
                            {localStorage.getItem("usuario-supabase")?.toLowerCase() || "Usuario"}
                        </p>

                        <button
                            className="btn btn-outline-danger mt-3 w-100"
                            onClick={cerrarSesion}
                        >
                            <i className="bi bi-box-arrow-right me-2"></i>
                            Cerrar sesión
                        </button>
                    </div>
                )}
            </Nav>
        );
    }

    return (
        <Navbar expand="md" fixed="top" className="color-navbar shadow-lg" variant="dark">
            <Container>
                <Navbar.Brand
                    onClick={() => manejarNavegacion(esCatalogo ? "/catalogo" : "/")}
                    className="text-white fw-bold d-flex align-items-center"
                    style={{ cursor: "pointer" }}
                >
                    <img
                        alt=""
                        src={logo}
                        width="45"
                        height="45"
                        className="d-inline-block me-2"
                    />
                    <h4 className="mb-0">Discosa</h4>
                </Navbar.Brand>

                {/* Botón del menú */}
                {!esLogin && (
                    <Navbar.Toggle
                        aria-controls="menu-offcanvas"
                        onClick={manejarToggle}
                    />
                )}

                {/* Menú lateral */}
                <Navbar.Offcanvas
                    id="menu-offcanvas"
                    placement="end"
                    show={mostrarMenu}
                    onHide={() => setMostrarMenu(false)}
                >
                    <Offcanvas.Header closeButton>
                        <Offcanvas.Title>Menú Discosa</Offcanvas.Title>
                    </Offcanvas.Header>
                    <Offcanvas.Body>
                        {contenidoMenu}
                    </Offcanvas.Body>
                </Navbar.Offcanvas>
            </Container>

            <Nav.Link onClick={() => setMostrarChatIA(true)} className="text-white">
                <i className="bi bi-robot me-2"></i>
            </Nav.Link>
            <ChatIA mostrar={mostrarChatIA} onCerrar={() => setMostrarChatIA(false)} />



        </Navbar>
        
    );
};

export default Encabezado;