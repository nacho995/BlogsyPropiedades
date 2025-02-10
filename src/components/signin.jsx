import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../services/api';

export default function SignIn() {

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [displayError, setDisplayError] = useState(false)

    const navigate = useNavigate()

    useEffect(() => {
        if (localStorage.getItem('token')) {
            navigate('/')
        }
    }, [])

    const handleSubmit = async (e) => {
        e.preventDefault()

        try {
            const loginResponse = await loginUser({ email, password });
            console.log("Respuesta de login:", loginResponse);
        
            if (loginResponse.token && loginResponse.name) {
              localStorage.setItem("token", loginResponse.token);
              localStorage.setItem("name", loginResponse.name); // Guarda el nombre
              // Redirige al usuario o actualiza el estado de autenticación
              navigate('/');
            } else {
              setDisplayError("Email o contraseña incorrectos");
            }
          } catch (err) {
            console.error('Error al iniciar sesión:', err.message);
            setDisplayError("Hubo un error al iniciar sesión.");
          }
        



    }

    return (
        <div className="bg-gradient-to-tr from-blue-900 to-black/60 min-h-screen flex flex-col justify-start ">
            <h1 className="text-4xl font-bold text-center mb-8 relative mt-[25vh]">
                <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-white via-yellow-400 to-white ">
                    Sign In
                </span>
            </h1>
            <div className="flex flex-col justify-center items-center ">
                <form onSubmit={handleSubmit} className="flex flex-col justify-center items-center w-full max-w-lg">
                    <input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        autoComplete="email"
                        className="w-full p-2 mb-4 rounded-md border-2 border-gray-300"
                        required
                    />
                    <div className="flex items-center justify-between gap-20">
                        <div className="text-sm">
                            <Link to="/login/remember-password" className="font-semibold text-white hover:text-black">
                                ¿Olvidaste tu contraseña?
                            </Link>
                            <div className="text-center mt-4">
                            </div>
                        </div>
                    </div>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Password"
                        className="w-full p-2 mb-4 rounded-md border-2 border-gray-300"
                        required
                    />
                    {displayError && (
                        <div className="mb-4 text-center text-red-600 font-semibold">
                            {displayError}
                        </div>
                    )}
                    <button
                        type="submit"
                        className="bg-black text-white px-4 py-2 rounded hover:bg-white hover:text-black transition-colors duration-300"
                    >
                        Sign In
                    </button>
                    <div className="text-sm mt-4">
                    <button
                    type="button"
                        className="bg-black text-white px-4 py-2 rounded hover:bg-white hover:text-black transition-colors duration-300"
                    >
                        <Link  
                            to="/register">
                            Register
                        </Link>
                    </button>
                    </div>
                </form>
            </div>
        </div>
    )
}