module.exports = async function handler(req, res) {
  // Configurar headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Manejar preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Solo permitir métodos POST para registro
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: true, 
      message: 'Método no permitido' 
    });
  }

  try {
    const { email, password, name } = req.body;

    // Validar datos de entrada
    if (!email || !password || !name) {
      return res.status(400).json({
        error: true,
        message: 'Email, contraseña y nombre son requeridos'
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: true,
        message: 'Formato de email inválido'
      });
    }

    // Validar longitud de contraseña
    if (password.length < 6) {
      return res.status(400).json({
        error: true,
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    // Simulación de usuarios existentes para verificar duplicados
    const existingUsers = [
      'ignaciodalesio1995@gmail.com',
      'test@example.com'
    ];

    if (existingUsers.includes(email)) {
      return res.status(409).json({
        error: true,
        message: 'El email ya está registrado'
      });
    }

    // Simular creación de usuario exitosa
    const newUser = {
      id: Date.now(),
      email,
      name,
      role: 'user',
      createdAt: new Date().toISOString()
    };

    // Generar token JWT simple
    const token = Buffer.from(JSON.stringify({
      userId: newUser.id,
      email: newUser.email,
      exp: Date.now() + (24 * 60 * 60 * 1000) // 24 horas
    })).toString('base64');

    // Respuesta exitosa
    return res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error('Error en registro:', error);
    return res.status(500).json({
      error: true,
      message: 'Error interno del servidor'
    });
  }
}; 