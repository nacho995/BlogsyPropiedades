import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser, getCurrentUser } from "../services/api";
import { useUser } from "../context/UserContext";
import toast from "react-hot-toast";

export default function SignIn() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();
    
    const { login, isAuthenticated } = useUser();

    useEffect(() => {
        if (isAuthenticated) {
            navigate("/");
        }
    }, [isAuthenticated, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            if (!email || !password) {
                throw new Error("Por favor, completa todos los campos");
            }

            console.log("Intentando iniciar sesión con:", email);
            const response = await loginUser({ email, password });
            
            console.log("Respuesta original de login:", response);
            console.log("Tipo de respuesta:", typeof response);
            
            // Si la respuesta es una cadena vacía, mostrar mensaje específico
            if (response === "" || response === null || response === undefined) {
                console.error("Respuesta de login vacía o nula");
                throw new Error("El servidor no respondió correctamente. Por favor, intenta de nuevo más tarde.");
            }
            
            // Si la respuesta es una cadena (no vacía), mostrar su contenido
            if (typeof response === 'string') {
                console.error("Respuesta de login es una cadena:", response);
                throw new Error(`Respuesta inesperada del servidor: ${response}`);
            }
            
            // Verificar si es una respuesta generada automáticamente por el cliente
            let sessionWarning = "";
            if (response._notice) {
                console.warn("Usando respuesta generada localmente:", response);
                sessionWarning = "Sesión mantenida con datos locales debido a problemas en el servidor";
            } else if (response._recovered) {
                console.warn("Usando sesión recuperada:", response);
                sessionWarning = "Sesión recuperada utilizando datos locales debido a problemas con el servidor";
            } else if (response._errorRecovered) {
                console.warn("Sesión recuperada tras error:", response);
                sessionWarning = "Sesión recuperada tras un error de comunicación con el servidor";
            } else if (response.isTemporary) {
                console.warn("Usando sesión temporal:", response);
                sessionWarning = "Sesión temporal activada. Algunas funciones podrían no estar disponibles.";
            }
            
            // Mostrar advertencia si es necesario
            if (sessionWarning) {
                console.log("Mostrando advertencia:", sessionWarning);
                try {
                    // Usar toast básico sin opciones complejas para evitar errores
                    toast(sessionWarning, {
                        icon: '⚠️',
                        duration: 6000
                    });
                } catch (e) {
                    console.error("Error al mostrar toast:", e);
                    alert(sessionWarning); // Fallback a alert si toast falla
                }
            }
            
            console.log("Claves disponibles:", Object.keys(response));
            
            // Intentar extraer token y datos de usuario de varias estructuras posibles
            let token, userData;
            
            if (response && response.token) {
                // Estructura { token, user }
                token = response.token;
                userData = response.user || {};
            } else if (response && response.data && response.data.token) {
                // Estructura { data: { token, user } }
                token = response.data.token;
                userData = response.data.user || {};
            } else if (response && response.user && response.user.token) {
                // Estructura { user: { token, ... } }
                token = response.user.token;
                userData = response.user;
            } else if (response && response.accessToken) {
                // Estructura { accessToken, user }
                token = response.accessToken;
                userData = response.user || {};
            } else {
                console.error("No se pudo extraer token de la respuesta:", response);
                throw new Error("Formato de respuesta incorrecto. Por favor, contacta al soporte técnico.");
            }
            
            if (!token) {
                throw new Error("Error al iniciar sesión. No se recibió token de autenticación.");
            }

            console.log("Token extraído:", token);
            console.log("Datos de usuario extraídos:", userData);
            
            // Ejecutar login con los datos extraídos
            await login({
                token,
                name: userData?.name || "",
                user: userData,
                profilePic: userData?.profilePic || ""
            });

            toast.success("¡Inicio de sesión exitoso!");
            
            // Redirigir a la página principal
            navigate("/");
        } catch (err) {
            console.error("Error en login:", err);
            
            // Verificar si hay token existente para intentar mantener la sesión a pesar del error
            const savedToken = localStorage.getItem('token');
            if (savedToken && err.message && (
                err.message.includes("vacía") || 
                err.message.includes("no respondió") || 
                err.message.includes("formato") ||
                err.message.includes("inesperada")
            )) {
                console.log("Intentando login local con token existente tras error:", err.message);
                
                try {
                    const userName = localStorage.getItem('name') || email.split('@')[0] || 'Usuario';
                    
                    // Mantener la sesión usando el token local
                    await login({
                        token: savedToken,
                        name: userName,
                        user: { name: userName, email },
                        _recovered: true
                    });
                    
                    // Usar toast básico en lugar de toast.warning
                    try {
                        toast("Sesión mantenida con credenciales locales debido a problemas con el servidor", {
                            icon: '⚠️',
                            duration: 6000
                        });
                    } catch (e) {
                        console.error("Error al mostrar toast:", e);
                        alert("Sesión mantenida con credenciales locales"); 
                    }
                    
                    // Redirigir a la página principal
                    navigate("/");
                    return;
                } catch (loginErr) {
                    console.error("Error al intentar login local:", loginErr);
                }
            }
            
            setError(err.message || "Error al iniciar sesión");
            try {
                toast(err.message || "Error al iniciar sesión", {
                    icon: '❌'
                });
            } catch (e) {
                console.error("Error al mostrar toast de error:", e);
                alert(err.message || "Error al iniciar sesión");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-900 to-indigo-800 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Iniciar Sesión
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        ¿No tienes una cuenta?{" "}
                        <Link
                            to="/register"
                            className="font-medium text-indigo-600 hover:text-indigo-500"
                        >
                            Regístrate aquí
                        </Link>
                    </p>
                </div>
                
                {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
                        <p>{error}</p>
                    </div>
                )}
                
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="email-address" className="sr-only">
                                Correo electrónico
                            </label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="Correo electrónico"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">
                                Contraseña
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="Contraseña"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="text-sm">
                            <Link
                                to="/recover-password"
                                className="font-medium text-indigo-600 hover:text-indigo-500"
                            >
                                ¿Olvidaste tu contraseña?
                            </Link>
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
} 