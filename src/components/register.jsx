import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUser } from '../services/api';

export default function RegisterForm() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate();

    // Estados para validación y animación de shake
    const [errors, setErrors] = useState({
        name: false,
        email: false,
        password: false,
    });
    const [shake, setShake] = useState({
        name: false,
        email: false,
        password: false,
    });

    // Validar el formulario (retorna true si todo está bien)
    const validateForm = () => {
        const newErrors = {
            name: !name.trim(),
            email: !email.trim(),
            password: !password.trim(),
        };

        setErrors(newErrors);
        // Activar la animación de shake para los campos con error
        setShake(newErrors);

        // Desactivar la animación después de 0.3s
        setTimeout(() => {
            setShake({ name: false, email: false, password: false });
        }, 300);

        return !Object.values(newErrors).includes(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            setErrorMessage('Por favor corrige los campos marcados en rojo.');
            return;
        }
        try {
            const newUser = { name, email, password };
            const userData = await createUser(newUser); // Llama a la API para crear el usuario
            console.log("Usuario creado:", userData);
            window.localStorage.setItem('token', userData.token);
            setErrorMessage('');
            navigate('/');
        } catch (err) {
            console.error('Error al registrar al usuario:', err.message);
            setErrorMessage('Hubo un problema al registrar al usuario. Intenta de nuevo más tarde.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-blue-900 to-black/60">
            <form
                onSubmit={handleSubmit}
                className="bg-gradient-to-br from-blue-900 to-amarillo p-8 rounded-lg shadow-md max-w-lg w-full flex flex-col space-y-4"
            >
                {errorMessage && (
                    <p className="text-center text-red-500 font-semibold">{errorMessage}</p>
                )}
                <h2 className="text-2xl font-bold text-center">Datos para el registro</h2>

                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-black">Nombre:</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Nombre"
                        className={`mt-1 block w-full px-4 py-2 border-2 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 ${errors.name ? 'border-red-500 shake' : 'border-gray-300'
                            }`}
                        required
                    />
                    {errors.name && <p className="text-red-500 text-sm">El nombre es obligatorio</p>}
                </div>

                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-black">Email:</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="Email"
                        className={`mt-1 block w-full px-4 py-2 border-2 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 ${errors.email ? 'border-red-500 shake' : 'border-gray-300'
                            }`}
                        required
                    />
                    {errors.email && <p className="text-red-500 text-sm">El email es obligatorio</p>}
                </div>

                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-black">Contraseña:</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Contraseña"
                        className={`mt-1 block w-full px-4 py-2 border-2 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 ${errors.password ? 'border-red-500 shake' : 'border-gray-300'
                            }`}
                        required
                    />
                    {errors.password && <p className="text-red-500 text-sm">La contraseña es obligatoria</p>}
                   
                </div>

                <button
                    type="submit"
                    className="bg-black text-white px-4 py-2 rounded hover:bg-white hover:text-black transition-colors duration-300"
                >
                    Registrarse
                </button>
            </form>

            {/* Estilos para la animación de shake */}
            <style>
                {`
          @keyframes shake {
            0% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            50% { transform: translateX(5px); }
            75% { transform: translateX(-5px); }
            100% { transform: translateX(0); }
          }
          .shake {
            animation: shake 0.3s ease-in-out;
          }
        `}
            </style>
        </div>
    );
}
