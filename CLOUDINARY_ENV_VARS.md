# Variables de Entorno de Cloudinary para Vercel

## 🔧 Configurar en Vercel Dashboard

Ve a: https://vercel.com/dashboard → Tu Proyecto → Settings → Environment Variables

Añade estas variables:

```
CLOUDINARY_CLOUD_NAME = dv31mt6pd
CLOUDINARY_API_KEY = 915443216824292  
CLOUDINARY_API_SECRET = FMDbe6eOaHniPHQnrn-qbd6EqW4
```

## 📝 Opcional: Upload Preset

1. Ve a tu Dashboard de Cloudinary: https://cloudinary.com/console
2. Settings → Upload → Upload presets
3. Crea un preset llamado `blogsy_preset` 
4. Configúralo como:
   - Mode: Unsigned (para uploads desde frontend)
   - Folder: blogsy-uploads
   - Resource type: Auto
   - Access mode: Public

## ✅ Una vez configurado

El endpoint `/api/cloudinary/signature` generará firmas reales y válidas para subir imágenes. 