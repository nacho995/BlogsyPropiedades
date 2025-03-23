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

            const response = await loginUser({ email, password });
            
            console.log("Respuesta original de login:", response);
            console.log("Tipo de respuesta:", typeof response);
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
                throw new Error("Formato de respuesta incorrecto");
            }
            
            if (!token) {
                throw new Error("Error al iniciar sesión. No se recibió token de autenticación.");
            }

            console.log("Token extraído:", token);
            console.log("Datos de usuario extraídos:", userData);
            
            login({
                token,
                name: userData?.name || "",
                user: userData,
                profilePic: userData?.profilePic || ""
            });

            toast.success("¡Inicio de sesión exitoso!");
            
            navigate("/");
        } catch (err) {
            console.error("Error en login:", err);
            setError(err.message || "Error al iniciar sesión");
            toast.error(err.message || "Error al iniciar sesión");
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