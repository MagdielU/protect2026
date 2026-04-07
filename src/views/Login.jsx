import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import FormularioLogin from "../components/login/FormularioLogin";
import { supabase } from "../database/supabaseconfi";
import { Container, Row, Col, Button } from "react-bootstrap";

const Login = () => {

    const [usuario, setUsuario] = useState("");
    const [contrasena, setContrasena] = useState("");
    const [error, setError] = useState(null);
    const navegar = useNavigate();

    const estiloContenedor = {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "108%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #FFDEE9, #B5FFFC)",
        overflow: "hidden",
        padding: "20px",
    };

    const iniciarSesion = async () => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: usuario,
                password: contrasena,
            });

            if (error) {
                setError("Usuario o contraseña incorrectos");
                return;
            }

            if (data.user) {
                localStorage.setItem("usuario-supabase", usuario);
                navegar("/");
            }

        } catch (err) {
            setError("Error al conectar con el servidor");
            console.error("Error en la solicitud:", err);
        }
    };

    useEffect(() => {
        const usuarioGuardado = localStorage.getItem("usuario-supabase");
        if (usuarioGuardado) {
            navegar("/");
        }
    }, [navegar]);

    return (
        <div style={estiloContenedor}>
            <FormularioLogin
                usuario={usuario}
                contrasena={contrasena}
                error={error}
                setUsuario={setUsuario}
                setContrasena={setContrasena}
                iniciarSesion={iniciarSesion}
            />
        </div>
    );
};

export default Login;