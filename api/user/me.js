export default async function handler(req, res) {
  // Solo permitir métodos GET para obtener perfil
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      error: true, 
      message: 'Método no permitido' 
    });
  }

  // Configurar headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  try {
    // Obtener token del header Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: true,
        message: 'Token de autorización requerido'
      });
    }

    const token = authHeader.replace('Bearer ', '');

    // Decodificar token simple (en producción usar JWT real)
    let tokenData;
    try {
      tokenData = JSON.parse(Buffer.from(token, 'base64').toString());
    } catch (e) {
      return res.status(401).json({
        error: true,
        message: 'Token inválido'
      });
    }

    // Verificar expiración del token
    if (tokenData.exp < Date.now()) {
      return res.status(401).json({
        error: true,
        message: 'Token expirado'
      });
    }

    // Simulación de datos de usuario (en producción vendría de base de datos)
    const users = [
      {
        id: 1,
        email: 'ignaciodalesio1995@gmail.com',
        name: 'Ignacio Dalesio',
        role: 'admin',
        profilePic: null
      },
      {
        id: 2,
        email: 'test@example.com',
        name: 'Usuario de Prueba',
        role: 'user',
        profilePic: null
      }
    ];

    const user = users.find(u => u.id === tokenData.userId);

    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'Usuario no encontrado'
      });
    }

    // Devolver datos del usuario (sin contraseña)
    return res.status(200).json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      profilePic: user.profilePic
    });

  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    return res.status(500).json({
      error: true,
      message: 'Error interno del servidor'
    });
  }
} 