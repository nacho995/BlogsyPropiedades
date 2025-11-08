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
    const bcrypt = require('bcryptjs');
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

    const { token, password, passwordConfirm } = req.body;

    if (!token || !password || !passwordConfirm) {
      return res.status(400).json({ 
        error: true, 
        message: 'Token, contraseña y confirmación son requeridos' 
      });
    }

    if (password !== passwordConfirm) {
      return res.status(400).json({ 
        error: true, 
        message: 'Las contraseñas no coinciden' 
      });
    }

    if (password.length < 8) {
      return res.status(400).json({ 
        error: true, 
        message: 'La contraseña debe tener al menos 8 caracteres' 
      });
    }

    // Hashear el token para comparar con la base de datos
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Buscar usuario con el token válido y no expirado
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ 
        error: true, 
        message: 'El token es inválido o ha expirado' 
      });
    }

    // Hashear la nueva contraseña
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    
    // Limpiar el token de recuperación
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    await user.save();

    console.log(`✅ Contraseña restablecida para usuario: ${user.email}`);

    res.status(200).json({ 
      success: true,
      message: 'Contraseña restablecida exitosamente' 
    });

  } catch (error) {
    console.error('❌ Error en reset-password:', error);
    res.status(500).json({ 
      error: true, 
      message: 'Error al restablecer la contraseña',
      details: error.message 
    });
  }
}
