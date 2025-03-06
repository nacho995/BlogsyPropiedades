import React, { useState } from 'react';
import { updateProfile } from '../services/api';
import { useUser } from "../context/UserContext";
import ProfileImageUploader from './ProfileImageUploader';

export default function CambiarPerfil() {
  const { user, login } = useUser();
  const [name, setName] = useState(user?.name || '');
  const [profilePic, setProfilePic] = useState(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleFileSelected = (file) => {
    setProfilePic(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    if (!name.trim() && !profilePic) {
      setMessage('Por favor ingresa al menos un valor para actualizar.');
      setIsLoading(false);
      return;
    }

    const userData = {};
    if (name.trim() !== '') {
      userData.name = name;
    }
    if (profilePic) {
      userData.profilePic = profilePic;
    }

    try {
      const result = await updateProfile(userData);
      
      login({
        ...user,
        name: result.name || user.name,
        profilePic: result.profilePic || user.profilePic,
        _updatedAt: new Date().toISOString()
      });
      
      setMessage('Perfil actualizado correctamente');
    } catch (error) {
      console.error("Error al actualizar el perfil:", error);
      setMessage('Hubo un error al actualizar el perfil. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderUserAvatar = (user) => {
    const profileImage = user?.profileImage || user?.profilePic || null;
    
    if (profileImage) {
      return (
        <img 
          src={profileImage} 
          alt={`${user?.name || 'Usuario'}`}
          className="rounded-full w-32 h-32 object-cover border-4 border-indigo-600 mx-auto"
          onError={(e) => e.target.src = "https://placehold.co/150"}
        />
      );
    } else {
      return (
        <div className="rounded-full w-32 h-32 bg-gray-300 flex items-center justify-center border-4 border-indigo-600 mx-auto">
          <span className="text-gray-600 font-semibold text-5xl">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </span>
        </div>
      );
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen py-12">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl p-8">
        <div className="md:flex">
          <div className="p-8 w-full">
            <div className="uppercase tracking-wide text-sm text-indigo-500 font-semibold mb-1">Tu cuenta</div>
            <h1 className="block mt-1 text-lg leading-tight font-medium text-black">Actualiza tu perfil</h1>
            
            {message && (
              <div className={`mt-4 p-3 rounded ${message.includes('error') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                {message}
              </div>
            )}

            <div className="mt-4 mb-6">
              {renderUserAvatar(user)}
              <p className="text-center text-gray-600 mt-2">{user?.name || 'Usuario'}</p>
            </div>

            <form onSubmit={handleSubmit} className="mt-6">
              <div className="mb-6">
                <ProfileImageUploader 
                  currentImageUrl={user?.profilePic} 
                  onImageUpdated={handleFileSelected} 
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border"
                />
              </div>

              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled={isLoading}
              >
                {isLoading ? 'Actualizando...' : 'Actualizar Perfil'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
