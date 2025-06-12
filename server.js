const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

// Importar rutas
const authRoutes = require('./routes/auth-routes');
const chatRoutes = require('./routes/chat-routes');

// Importar lógica de negocio
const ChatBusiness = require('./business/chat-logic');
const UsuariosData = require('./data/usuarios');
const MascotasData = require('./data/mascotas');

// Crear aplicación Express
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Configuración de middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configuración de sesiones
app.use(session({
    secret: process.env.SESSION_SECRET || 'veterinaria-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Cambiar a true en producción con HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
    }
}));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Rutas principales
app.use('/auth', authRoutes);
app.use('/chat', chatRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

// Ruta raíz - redirigir al login
app.get('/', (req, res) => {
    if (req.session.usuario) {
        // Redirigir según el rol del usuario
        switch (req.session.usuario.rol) {
            case 'admin':
                res.redirect('/dashboard-admin.html');
                break;
            case 'veterinario':
                res.redirect('/dashboard-veterinario.html');
                break;
            case 'cliente':
                res.redirect('/dashboard-cliente.html');
                break;
            default:
                res.redirect('/login.html');
        }
    } else {
        res.redirect('/login.html');
    }
});

// Rutas para servir páginas HTML
app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.get('/dashboard-cliente.html', (req, res) => {
    if (!req.session.usuario || req.session.usuario.rol !== 'cliente') {
        return res.redirect('/login.html');
    }
    res.sendFile(path.join(__dirname, 'views', 'dashboard-cliente.html'));
});

app.get('/dashboard-veterinario.html', (req, res) => {
    if (!req.session.usuario || req.session.usuario.rol !== 'veterinario') {
        return res.redirect('/login.html');
    }
    res.sendFile(path.join(__dirname, 'views', 'dashboard-veterinario.html'));
});

app.get('/dashboard-admin.html', (req, res) => {
    if (!req.session.usuario || req.session.usuario.rol !== 'admin') {
        return res.redirect('/login.html');
    }
    res.sendFile(path.join(__dirname, 'views', 'dashboard-admin.html'));
});


app.get('/registro.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'registro.html'));
});

app.get('/dashboard-cliente.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'dashboard-cliente.html'));
});
app.get('/chat.html', (req, res) => {
    if (!req.session.usuario) {
        return res.redirect('/login.html');
    }
    res.sendFile(path.join(__dirname, 'views', 'chat.html'));
});

// API para obtener información del usuario actual
app.get('/api/usuario-actual', (req, res) => {
    if (!req.session.usuario) {
        return res.status(401).json({
            success: false,
            message: 'No autorizado'
        });
    }

    res.json({
        success: true,
        usuario: req.session.usuario
    });
});

app.get('/api/veterinarios', (req, res) => {
    if (!req.session.usuario) return res.json({ veterinarios: [] });
    UsuariosData.obtenerVeterinarios()
        .then(veterinarios => res.json({ veterinarios }))
        .catch(() => res.json({ veterinarios: [] }));
});

app.get('/api/mascotas', async (req, res) => {
    if (!req.session.usuario) return res.json({ mascotas: [] });
    try {
        const mascotas = await MascotasData.obtenerPorPropietario(req.session.usuario.id);
        res.json({ mascotas });
    } catch (e) {
        res.json({ mascotas: [] });
    }
});

// Configuración de Socket.IO para el chat
io.on('connection', (socket) => {
    console.log('Usuario conectado:', socket.id);

    // Unirse a una sala de chat específica (por cita)
    socket.on('join-chat', async (data) => {
        try {
            const { citaId, usuario } = data;
            
            // Validar acceso a la sala
            const validacion = await ChatBusiness.validarAccesoSala(
                citaId, 
                usuario.id, 
                usuario.rol
            );

            if (!validacion.acceso) {
                socket.emit('error', { message: validacion.message });
                return;
            }


            socket.join(`cita-${citaId}`);
            socket.usuario = usuario;
            socket.citaId = citaId;

            // Obtener mensajes existentes
            const resultado = await ChatBusiness.obtenerMensajes(
                citaId, 
                usuario.id, 
                usuario.rol
            );

            if (resultado.success) {
                socket.emit('mensajes-anteriores', {
                    mensajes: resultado.mensajes,
                    cita: resultado.cita
                });
            }

            // Notificar a otros usuarios en la sala
            socket.to(`cita-${citaId}`).emit('usuario-conectado', {
                usuario: usuario.nombre,
                rol: usuario.rol
            });

            console.log(`Usuario ${usuario.nombre} se unió al chat de la cita ${citaId}`);

        } catch (error) {
            console.error('Error al unirse al chat:', error);
            socket.emit('error', { message: 'Error al conectar al chat' });
        }
    });

    // Enviar mensaje
    socket.on('enviar-mensaje', async (data) => {
        try {
            if (!socket.usuario || !socket.citaId) {
                socket.emit('error', { message: 'No autorizado' });
                return;
            }

            const { mensaje } = data;

            // Enviar mensaje usando la lógica de negocio
            const resultado = await ChatBusiness.enviarMensaje(
                {
                    cita_id: socket.citaId,
                    mensaje: mensaje
                },
                socket.usuario.id,
                socket.usuario.rol
            );

            if (resultado.success) {
                // Preparar datos del mensaje para enviar
                const mensajeCompleto = {
                    id: resultado.mensaje.id,
                    mensaje: resultado.mensaje.mensaje,
                    fecha_envio: resultado.mensaje.fecha_envio,
                    usuario_nombre: socket.usuario.nombre,
                    usuario_rol: socket.usuario.rol,
                    usuario_id: socket.usuario.id
                };

                // Enviar mensaje a todos los usuarios en la sala
                io.to(`cita-${socket.citaId}`).emit('nuevo-mensaje', mensajeCompleto);

                console.log(`Mensaje enviado en cita ${socket.citaId} por ${socket.usuario.nombre}`);
            } else {
                socket.emit('error', { message: resultado.message });
            }

        } catch (error) {
            console.error('Error al enviar mensaje:', error);
            socket.emit('error', { message: 'Error al enviar mensaje' });
        }
    });

    // Usuario escribiendo
    socket.on('escribiendo', (data) => {
        if (socket.usuario && socket.citaId) {
            socket.to(`cita-${socket.citaId}`).emit('usuario-escribiendo', {
                usuario: socket.usuario.nombre,
                escribiendo: data.escribiendo
            });
        }
    });

    // Desconexión
    socket.on('disconnect', () => {
        if (socket.usuario && socket.citaId) {
            socket.to(`cita-${socket.citaId}`).emit('usuario-desconectado', {
                usuario: socket.usuario.nombre,
                rol: socket.usuario.rol
            });
            console.log(`Usuario ${socket.usuario.nombre} desconectado del chat`);
        }
        console.log('Usuario desconectado:', socket.id);
    });
});

// Manejo de errores 404
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Ruta no encontrada'
    });
});


// Manejo de errores generales
app.use((error, req, res, next) => {
    console.error('Error en la aplicación:', error);
    res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
    });
});

// Iniciar servidor
const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
    console.log(`🚀 Servidor iniciado en http://localhost:${PORT}`);
    console.log(`📱 Aplicación Veterinaria - Modo: ${process.env.NODE_ENV || 'development'}`);
});

// Manejo de cierre graceful
process.on('SIGINT', () => {
    console.log('\n🔄 Cerrando servidor...');
    server.close(() => {
        console.log('✅ Servidor cerrado correctamente');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\n🔄 Cerrando servidor...');
    server.close(() => {
        console.log('✅ Servidor cerrado correctamente');
        process.exit(0);
    });
});