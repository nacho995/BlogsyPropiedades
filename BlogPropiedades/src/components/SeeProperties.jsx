import React, { Fragment, useEffect, useState, useContext } from 'react';
import { Dialog, Transition } from "@headlessui/react";
import { Link, useNavigate } from 'react-router-dom';
import { deletePropertyPost, getProperties } from '../services/api';
import { FiHome, FiMapPin, FiDollarSign, FiMaximize, FiEye, FiEdit, FiTrash2 } from 'react-icons/fi';
import { UserContext } from '../context/UserContext';
import { toast } from 'sonner';
import { formatPrice } from '../utils';

export default function SeeProperties() {
    const [property, setProperty] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [propertyToDelete, setPropertyToDelete] = useState(null);
    const [loading, setLoading] = useState(true);
    const [deleteLoading, setDeleteLoading] = useState({});
    
    // Usar useContext directamente con manejo de errores
    const userContext = useContext(UserContext);
    const user = userContext?.user || null;

    useEffect(() => {
        let isMounted = true;

        const fetchProperty = async () => {
            try {
                const PropertyData = await getProperties();
                
                if (!isMounted) return;
                
                // Verificar que PropertyData sea un array antes de usar map
                if (!Array.isArray(PropertyData)) {
                    console.error('Error: PropertyData no es un array:', PropertyData);
                    setProperty([]);
                    setLoading(false);
                    return;
                }
                
                // Normalizar el formato de las imágenes para cada propiedad
                const normalizedProperties = PropertyData.map(prop => {
                    let propertyImages = [];
                    
                    // Manejar imagen principal si existe
                    if (prop.image && typeof prop.image === 'object' && prop.image.src) {
                        propertyImages.push(prop.image);
                    } else if (prop.image && typeof prop.image === 'string') {
                        propertyImages.push({ src: prop.image, alt: "Imagen principal" });
                    }
                    
                    // Manejar array de imágenes adicionales
                    if (prop.images && Array.isArray(prop.images)) {
                        const additionalImages = prop.images.map(img => {
                            if (typeof img === 'string') {
                                return { src: img, alt: "Imagen de la propiedad" };
                            } else if (typeof img === 'object' && img.src) {
                                return img;
                            }
                            return null;
                        }).filter(img => img !== null);
                        
                        propertyImages = [...propertyImages, ...additionalImages];
                    }
                    
                    return {
                        ...prop,
                        images: propertyImages
                    };
                });
                
                if (isMounted) {
                    setProperty(normalizedProperties);
                    setLoading(false);
                }
            } catch (error) {
                console.error('Error al obtener las propiedades:', error);
                if (isMounted) {
                    // Usar toast básico en lugar de toast.error
                    try {
                        toast('Error al cargar las propiedades', {
                            icon: '❌',
                            duration: 4000
                        });
                    } catch (e) {
                        console.error('Error al mostrar notificación:', e);
                        alert('Error al cargar las propiedades');
                    }
                    setLoading(false);
                    setProperty([]); // Inicializar con array vacío en caso de error
                }
            }
        };

        fetchProperty();

        return () => {
            isMounted = false;
        };
    }, []);

    const openDeleteModal = (property) => {
        if (!user || !(user.role === 'admin' || user.role === 'ADMIN' || user.isAdmin)) {
            toast.error('No tienes permisos para eliminar propiedades');
            return;
        }
        setPropertyToDelete(property);
        setIsOpen(true);
    };

    const handleDeleteClick = (property_id) => {
        // Buscar la propiedad por su ID
        const propertyToDelete = property.find(prop => prop._id === property_id);
        if (propertyToDelete) {
            openDeleteModal(propertyToDelete);
        }
    };

    const confirmDelete = async (property_id) => {
        try {
            setDeleteLoading(prevState => ({ ...prevState, [property_id]: true }));
            const deleted = await deletePropertyPost(property_id);
            if (deleted) {
                try {
                    toast('Propiedad eliminada correctamente', {
                        icon: '✅',
                        duration: 4000
                    });
                } catch (e) {
                    console.error('Error al mostrar notificación:', e);
                }
                // Actualizar el estado para que no se muestre la propiedad eliminada
                setProperty(prevProperties => prevProperties.filter(prop => prop._id !== property_id));
            } else {
                try {
                    toast('Error al eliminar la propiedad', {
                        icon: '❌',
                        duration: 4000
                    });
                } catch (e) {
                    console.error('Error al mostrar notificación:', e);
                    alert('Error al eliminar la propiedad');
                }
            }
        } catch (error) {
            console.error('Error al eliminar la propiedad:', error);
            try {
                toast('Error al eliminar la propiedad', {
                    icon: '❌',
                    duration: 4000
                });
            } catch (e) {
                console.error('Error al mostrar notificación:', e);
                alert('Error al eliminar la propiedad');
            }
        } finally {
            setDeleteLoading(prevState => ({ ...prevState, [property_id]: false }));
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-tr from-blue-900 to-black/60 min-h-screen py-6 sm:py-8">
            <div className="container mx-auto px-4 sm:px-6">
                <h1 className="text-3xl sm:text-4xl font-bold text-center mb-6 sm:mb-8">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-yellow-400 to-white">
                        Propiedades
                    </span>
                </h1>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {property.length === 0 ? (
                        <p className="text-white col-span-full text-center">No hay propiedades disponibles.</p>
                    ) : (
                        property.map((prop) => (
                            <div key={prop._id} className="bg-white rounded-lg shadow-xl overflow-hidden">
                                {/* Imagen Principal */}
                                <div className="relative h-40 sm:h-48">
                                    {prop.images && prop.images.length > 0 ? (
                                        <img
                                            src={prop.images[0].src}
                                            alt={prop.images[0].alt || "Imagen de la propiedad"}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.target.src = "https://via.placeholder.com/400x300?text=Imagen+no+disponible";
                                            }}
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                            <span className="text-gray-400">Sin imagen disponible</span>
                                        </div>
                                    )}
                                    {prop.images && prop.images.length > 1 && (
                                        <span className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                                            +{prop.images.length - 1} fotos
                                        </span>
                                    )}
                                </div>

                                {/* Información de la propiedad */}
                                <div className="p-4 sm:p-5">
                                    <h2 className="text-lg sm:text-xl font-semibold mb-2 line-clamp-1">{prop.typeProperty}</h2>
                                    <div 
                                      className="text-gray-600 mb-4 text-sm sm:text-base line-clamp-2 property-description-preview" 
                                      dangerouslySetInnerHTML={{ __html: prop.description || '' }} 
                                    />
                                    
                                    <div className="space-y-2 text-xs sm:text-sm text-gray-600 mb-3">
                                        <div className="flex items-center">
                                            <FiMapPin className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                                            <span className="line-clamp-1">{prop.address}</span>
                                        </div>
                                        <div className="flex items-center">
                                            <FiMaximize className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                                            <span>{prop.m2} m²</span>
                                        </div>
                                        <div className="flex items-center">
                                            <FiDollarSign className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                                            <span>{formatPrice(prop.price)}</span>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <div className="flex flex-wrap gap-2">
                                            <Link
                                                to={`/property/${prop._id}`}
                                                className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors text-xs sm:text-sm"
                                                title="Ver detalles de la propiedad"
                                            >
                                                <FiEye className="h-3 w-3 sm:h-4 sm:w-4" />
                                                <span>Ver detalles</span>
                                            </Link>

                                            {user && (user.role === 'admin' || user.role === 'ADMIN' || user.isAdmin) && (
                                                <>
                                                    <Link
                                                        to={`/add-property?edit=${prop._id}`}
                                                        className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-xs sm:text-sm"
                                                        title="Editar propiedad"
                                                    >
                                                        <FiEdit className="h-3 w-3 sm:h-4 sm:w-4" />
                                                        <span>Editar</span>
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDeleteClick(prop._id)}
                                                        className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-xs sm:text-sm"
                                                        title="Eliminar propiedad"
                                                        disabled={deleteLoading[prop._id]}
                                                    >
                                                        <FiTrash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                                        <span>{deleteLoading[prop._id] ? 'Eliminando...' : 'Eliminar'}</span>
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <Transition appear show={isOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => setIsOpen(false)}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black bg-opacity-25" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                    <Dialog.Title
                                        as="h3"
                                        className="text-lg font-medium leading-6 text-gray-900"
                                    >
                                        Confirmar eliminación
                                    </Dialog.Title>
                                    <div className="mt-2">
                                        <p className="text-sm text-gray-500">
                                            ¿Estás seguro de que quieres eliminar esta propiedad?
                                        </p>
                                    </div>

                                    <div className="mt-4 flex justify-end gap-2">
                                        <button
                                            type="button"
                                            className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                                            onClick={() => setIsOpen(false)}
                                            disabled={propertyToDelete && deleteLoading[propertyToDelete._id]}
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="button"
                                            className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                                            onClick={() => confirmDelete(propertyToDelete._id)}
                                            disabled={propertyToDelete && deleteLoading[propertyToDelete._id]}
                                        >
                                            {propertyToDelete && deleteLoading[propertyToDelete._id] ? 'Eliminando...' : 'Eliminar'}
                                        </button>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </div>
    );
}
