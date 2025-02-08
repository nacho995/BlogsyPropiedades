import React, { useState, useEffect } from 'react';
import { updateProfile } from '../services/api';

export default function CambiarPerfil() {
  const [name, setName] = useState('');
  const [profilePic, setProfilePic] = useState(null);
  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState('');

  // Maneja el cambio del input de archivo y genera una vista previa
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    console.log("Archivo seleccionado:", file);
    setProfilePic(file);
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      console.log("Vista previa URL generada:", objectUrl);
      setPreview(objectUrl);
    }
  };

  // Limpieza de URL de objeto cuando cambia o se desmonta
  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  // Manejador del envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    // Creamos un FormData y agregamos los campos solo si tienen valor
    const formData = new FormData();
    if (name.trim() !== '') {
      formData.append('name', name);
    }
    if (profilePic) {
      formData.append('profilePic', profilePic);
    }

    // Si ningún campo se actualizó, mostramos un mensaje y detenemos la ejecución
    if (!name.trim() && !profilePic) {
      setMessage('Por favor ingresa al menos un valor para actualizar.');
      return;
    }

    try {
      // Llamamos a la API para actualizar el perfil
      const result = await updateProfile(formData);
      console.log("Perfil actualizado:", result);
      // Si la respuesta incluye una nueva URL para la foto, actualízala
      if (result.profilePic) {
        setPreview(result.profilePic);
        localStorage.setItem('profilePic', result.profilePic);
      }
      setMessage('Perfil actualizado correctamente');
    } catch (error) {
      console.error("Error al actualizar el perfil:", error);
      setMessage('Hubo un error al actualizar el perfil. Intenta de nuevo.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-700 via-black to-amarillo p-4">
      <div className="max-w-md w-full bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-center">Cambiar Perfil</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Nombre (opcional)
            </label>
            <input
              type="text"
              id="name"
              name="name"
              placeholder="Ingresa tu nuevo nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="profilePic" className="block text-sm font-medium text-gray-700">
              Foto de Perfil (opcional)
            </label>
            <input
              type="file"
              id="profilePic"
              name="profilePic"
              accept="image/*"
              onChange={handleFileChange}
              className="mt-1 block w-full"
            />
            {preview && (
              <img
                src={preview}
                alt="Vista previa"
                className="mt-2 h-20 w-20 rounded-full object-cover"
              />
            )}
          </div>
          <button
            type="submit"
            className="w-full bg-black text-white py-2 px-4 rounded hover:bg-amarillo hover:text-black transition-colors duration-300"
          >
            Guardar Cambios
          </button>
          {message && <p className="text-center text-red-600">{message}</p>}
        </form>
      </div>
    </div>
  );
}
