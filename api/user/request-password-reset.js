module.exports = async function handler(req, res) {
  // Configurar headers CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Manejar preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Solo permitir métodos POST
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: true, 
      message: 'Método no permitido' 
    });
  }

  try {
    const mongoose = require('mongoose');
    const crypto = require('crypto');

    // Schema del usuario
    const userSchema = new mongoose.Schema({
      name: String,
      email: { type: String, unique: true, required: true },
      password: { type: String, required: true },
      role: { type: String, default: 'user' },
      profilePic: String,
      resetPasswordToken: String,
      resetPasswordExpires: Date
    }, { timestamps: true });

    const User = mongoose.models.User || mongoose.model('User', userSchema);

    // Conectar a MongoDB
    const connectDB = async () => {
      if (mongoose.connections[0].readyState) return;
      
      const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://ignaciodalesio1995:Porsche987@cluster0.dcvt5dd.mongodb.net/goza-madrid?retryWrites=true&w=majority';
      
      try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ MongoDB conectado');
      } catch (error) {
        console.error('❌ Error conectando a MongoDB:', error);
        throw error;
      }
    };

    await connectDB();

    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        error: true, 
        message: 'El email es requerido' 
      });
    }

    // Buscar usuario por email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Por seguridad, no revelar si el usuario existe o no
      return res.status(200).json({ 
        success: true,
        message: 'Si el email existe, recibirás un enlace de recuperación' 
      });
    }

    // Generar token de recuperación
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Guardar token hasheado en la base de datos
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    // Token expira en 1 hora
    user.resetPasswordExpires = Date.now() + 3600000;
    
    await user.save();

    // En producción, aquí enviarías un email
    // Por ahora, devolvemos el token en la respuesta (solo para desarrollo)
    const resetUrl = `${process.env.FRONTEND_URL || 'https://blogs.realestategozamadrid.com'}/reset-password/${resetToken}`;
    
    console.log(`🔗 URL de recuperación para ${email}: ${resetUrl}`);
    
    // TODO: Implementar envío de email real
    // await sendPasswordResetEmail(user.email, resetUrl);

    res.status(200).json({ 
      success: true,
      message: 'Se ha enviado un enlace de recuperación a tu correo electrónico',
      // En desarrollo, incluir el enlace
      ...(process.env.NODE_ENV !== 'production' && { 
        resetUrl,
        devNote: 'Este enlace solo se muestra en desarrollo. En producción se enviará por email.' 
      })
    });

  } catch (error) {
    console.error('❌ Error en request-password-reset:', error);
    res.status(500).json({ 
      error: true, 
      message: 'Error al procesar la solicitud',
      details: error.message 
    });
  }
}
