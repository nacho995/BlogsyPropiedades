module.exports = async function handler(req, res) {
  // Configurar headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Manejar preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Solo permitir métodos POST para login
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: true, 
      message: 'Método no permitido' 
    });
  }

  try {
    const { email, password } = req.body;

    // Validar datos de entrada
    if (!email || !password) {
      return res.status(400).json({
        error: true,
        message: 'Email y contraseña son requeridos'
      });
    }

    // TODO: Aquí deberías implementar la lógica real de autenticación
    // Por ahora, crearemos una respuesta simulada para probar
    
    // Simulación de usuarios para testing
    const testUsers = [
      {
        id: 1,
        email: 'ignaciodalesio1995@gmail.com',
        password: 'test123', // En producción, esto estaría hasheado
        name: 'Ignacio Dalesio',
        role: 'admin'
      },
      {
        id: 2,
        email: 'test@example.com',
        password: 'test123',
        name: 'Usuario de Prueba',
        role: 'user'
      }
    ];

    // Buscar usuario
    const user = testUsers.find(u => u.email === email && u.password === password);

    if (!user) {
      return res.status(401).json({
        error: true,
        message: 'Credenciales inválidas'
      });
    }

    // Generar token JWT simple (en producción usar una biblioteca JWT real)
    const token = Buffer.from(JSON.stringify({
      userId: user.id,
      email: user.email,
      exp: Date.now() + (24 * 60 * 60 * 1000) // 24 horas
    })).toString('base64');

    // Respuesta exitosa
    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({
      error: true,
      message: 'Error interno del servidor'
    });
  }
}; 