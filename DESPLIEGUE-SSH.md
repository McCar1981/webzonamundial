# Despliegue de ZonaMundial en SWPanel via SSH

Esta guia explica paso a paso como subir el proyecto a tu servidor SWPanel con acceso SSH.

## Requisitos previos

- Plan de hosting en SWPanel con **Node.js** habilitado (>= 18).
- Acceso **SSH** (usuario, host/IP y contraseña o clave privada).
- Cliente SSH/SCP instalado (Git Bash, Terminal, PuTTY, WinSCP, etc.).

## 1. Construir el proyecto en local

Desde la carpeta raiz del proyecto ejecuta:

```bash
npm install
npm run build
```

Esto generara la carpeta `.next/` y confirmara que todo compila correctamente.

## 2. Subir archivos al servidor

### Opcion A: SCP (recomendada en Mac/Linux/Git Bash)

```bash
# Empaqueta el proyecto
zip -r zonamundial.zip . -x "node_modules/*" ".git/*" ".claude/*"

# Sube el zip al servidor (reemplaza usuario, host y ruta)
scp zonamundial.zip usuario@IP_DEL_SERVIDOR:/home/usuario/web/zonamundial/
```

Luego conectate por SSH y descomprime:

```bash
ssh usuario@IP_DEL_SERVIDOR
cd /home/usuario/web/zonamundial
unzip zonamundial.zip
rm zonamundial.zip
```

### Opcion B: FTP/SFTP con FileZilla

1. Abre FileZilla.
2. Conectate con los datos de tu servidor (SFTP/SSH o FTP).
3. Sube **toda la carpeta del proyecto** excepto `node_modules/`, `.git/` y `.claude/`.
4. En el servidor instala las dependencias (ver paso 3).

## 3. Instalar dependencias en el servidor

Una vez conectado por SSH, navega a la carpeta del proyecto y ejecuta:

```bash
cd /ruta/de/tu/proyecto
npm install --production
```

> Nota: `better-sqlite3` y `nodemailer` necesitan compilacion nativa. Si falla, asegurate de que Node.js y `python3`/`make`/`g++` esten disponibles en el servidor.

## 4. Configurar variables de entorno

Crea el archivo `.env.local` en la carpeta raiz del proyecto en el servidor:

```bash
nano .env.local
```

Pega y completa con tus datos reales:

```env
# Sanity.io
NEXT_PUBLIC_SANITY_PROJECT_ID="tu-project-id"
NEXT_PUBLIC_SANITY_DATASET="production"
NEXT_PUBLIC_SANITY_API_VERSION="2024-01-01"
SANITY_API_TOKEN="tu-token"

# SMTP (para emails de bienvenida)
SMTP_HOST="smtp.tudominio.com"
SMTP_PORT="587"
SMTP_USER="tu-email@tudominio.com"
SMTP_PASS="tu-contraseña"
SMTP_FROM="noreply@zonamundial.app"
```

Guarda (`Ctrl+O`, `Enter`, `Ctrl+X`).

## 5. Asegurar permisos de escritura para SQLite

La base de datos SQLite se crea automaticamente en `data/zonamundial.db`. Asegurate de que la carpeta tenga permisos de escritura:

```bash
mkdir -p data
chmod 775 data
```

## 6. Arrancar la aplicacion

### Opcion A: npm start (para pruebas rapidas)

```bash
npm start
```

Escuchara en el puerto que definas (por defecto 3000). Para acceder desde fuera, configura el proxy inverso de Apache/Nginx en SWPanel para apuntar a `http://127.0.0.1:3000`.

### Opcion B: PM2 (recomendado para produccion)

Si tienes PM2 instalado en el servidor:

```bash
npm install -g pm2
pm2 start npm --name "zonamundial" -- start
pm2 save
pm2 startup
```

Esto mantiene la app activa incluso si reinicias el servidor.

## 7. Configurar el dominio / proxy inverso

En SWPanel busca la opcion de **Proxy Inverso**, **Nginx** o **Redirecciones**:

- Activa el proxy inverso para tu dominio.
- Apunta al puerto donde corre Node.js (ejemplo: `3000`).
- Si SWPanel te da una IP y puerto especificos, usa esos en el comando de inicio:

```bash
HOST=127.0.0.1 PORT=3000 npm start
```

## 8. Verificar que todo funciona

1. Abre tu dominio en el navegador.
2. Ve a `/registro` y completa un registro de prueba.
3. Comprueba que el contador en `GET /api/registro` aumenta.
4. Revisa que llegue el email de bienvenida (si configuraste SMTP).

## Comandos utiles de diagnostico

```bash
# Ver logs de la app con PM2
pm2 logs zonamundial

# Ver que puertos estan en uso
netstat -tlnp

# Probar conexion SMTP desde el servidor (si tienes telnet)
telnet smtp.tudominio.com 587
```

## Notas importantes

- No subas la carpeta `node_modules/` ni `.git/`.
- Si el servidor no tiene acceso a internet para descargar dependencias, deberas instalarlas localmente y subir `node_modules/` tambien.
- En algunos hostings compartidos el write del filesystem esta restringido. Si SQLite da error, contacta con soporte de SWPanel o migra a MySQL.
