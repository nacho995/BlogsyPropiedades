import CambiarPerfil from "../components/cambiarPerfil";
import Header from "../components/header";
import { useUser } from '../context/UserContext';

export default function ChangeProfilePage() {
    const { refreshUserData } = useUser();

    const handleSaveChanges = async () => {
        try {
            // ... código existente para guardar cambios ...
            
            // Después de guardar, actualiza los datos del usuario en el contexto
            await refreshUserData();
            
            // ... resto del código ...
        } catch (error) {
            // ... manejo de errores ...
        }
    };

    return (
        <>
            <Header />
            <CambiarPerfil />
        </>
    );
}