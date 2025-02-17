import React, { useEffect, useState } from 'react';
import { Dialog } from "@headlessui/react"; // Headless UI para el modal
import { Link } from 'react-router-dom';
import { deletePropertyPost, getPropertyPosts } from '../services/api';




export default function SeeProperty() {
    const [property, setProperty] = useState([]);
    const [isOpen, setIsOpen] = useState(false); // Estado para mostrar el modal
    const [propertyToDelete, setPropertyToDelete] = useState(null); // property que se eliminará

    useEffect(() => {
        const fetchProperty = async () => {
            try {
                const PropertyData = await getPropertyPosts();
                console.log('PropertyData:', PropertyData);
                setProperty(PropertyData);
            } catch (error) {
                console.error('Error al obtener los property:', error);
            }
        };
        fetchProperty();
    }, []);


    const openDeleteModal = (property) => {
        setPropertyToDelete(property);
        setIsOpen(true);
    };

    const confirmDelete = async () => {
        if (!propertyToDelete) return;
        try {
          await deletePropertyPost(propertyToDelete._id);
          // Filtramos directamente usando el id de la propiedad a eliminar
          setProperty(prevProperties => prevProperties.filter(prop => prop._id !== propertyToDelete._id));
        } catch (error) {
          console.error('Error al eliminar el property:', error);
        } finally {
          setIsOpen(false); // Cerrar modal
          setPropertyToDelete(null);
        }
      };
      

    return (
        <div className="bg-gradient-to-tr from-blue-900 to-black/60 min-h-screen flex flex-col justify-center items-center">
            <div className="container mx-auto p-4 flex flex-col justify-center items-start">
                <h1 className="text-4xl font-bold text-center mb-8 relative">
                    <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-white via-yellow-400 to-white">
                        Property
                    </span>
                </h1>
            </div>
            <div className="space-y-4">
                {property.length === 0 ? (
                    <p className="text-red-700">No hay propiedades disponibles.</p>
                ) : (
                    property.map((property) => (
                        <div key={property._id} className="bg-white p-4 rounded-md shadow-md">
                            <h2 className="text-2xl font-semibold">{property.typeProperty}</h2>
                            <p>{property.description}</p>
                            <p><strong>Dirección:</strong> {property.address}</p>
                            <p><strong>Metros cuadrados:</strong> {property.m2}</p>
                            <p><strong>Precio:</strong> {property.price}</p>

                            {/* Mostrar la imagen si existe */}
                            {property.images && property.images.length > 0 && (
                                <div className="mt-4">
                                    <img
                                        src={property.images[0].src} 
                                        alt={property.images[0].alt || 'Imagen de previsualización'}
                                        className="w-[30vh] h-[10vh] object-cover rounded-md"
                                    />
                                </div>
                            )}



                            <div className="m-4 flex justify-between">
                                <button
                                    onClick={() => openDeleteModal(property)}
                                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-700"
                                >
                                    Eliminar
                                </button>


                                <Link
                                    to={`/property/${property._id}`}
                                    className="bg-red-500 text-white px-4  py-2 rounded hover:bg-red-700"
                                >
                                    Ver completo
                                </Link>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* MODAL DE CONFIRMACIÓN */}
            <Dialog open={isOpen} onClose={() => setIsOpen(false)} className="fixed inset-0 flex items-center justify-center p-4">
                <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
                    <Dialog.Title className="text-lg font-semibold">Confirmar eliminación</Dialog.Title>
                    <Dialog.Description className="mt-2">
                        ¿Estás seguro de que quieres eliminar este property?
                    </Dialog.Description>

                    <div className="mt-4 flex justify-end gap-2">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={confirmDelete}
                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                            Eliminar
                        </button>
                    </div>
                </div>
            </Dialog>
        </div>
    );
}
