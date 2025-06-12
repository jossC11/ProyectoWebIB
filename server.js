const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

// Importar rutas
const authRoutes = require('./routes/auth-routes');

// Crear aplicación Express
const app = express();

// Configuración de middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configuración de sesiones
app.use(session({
    secret: process.env.SESSION_SECRET || 'veterinaria-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
    }
}));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rutas de autenticación
app.use('/auth', authRoutes);
app.use('/api/auth', authRoutes);

// Ruta raíz
app.get('/', (req, res) => {
    if (req.session.usuario) {
        if (req.session.usuario.rol === 'admin') {
            res.redirect('/dashboard-admin.html');
        } else if (req.session.usuario.rol === 'veterinario') {
            res.redirect('/dashboard-veterinario.html');
        } else if (req.session.usuario.rol === 'cliente') {
            res.redirect('/dashboard-cliente.html');
        } else {
            res.redirect('/login.html');
        }
    } else {
        res.redirect('/login.html');
    }
});

// Páginas HTML
app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.get('/registro.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'registro.html'));
});

app.get('/dashboard-cliente.html', (req, res) => {
    if (req.session.usuario && req.session.usuario.rol === 'cliente') {
        res.sendFile(path.join(__dirname, 'views', 'dashboard-cliente.html'));
    } else {
        res.redirect('/login.html');
    }
});

app.get('/dashboard-veterinario.html', (req, res) => {
    if (req.session.usuario && req.session.usuario.rol === 'veterinario') {
        res.sendFile(path.join(__dirname, 'views', 'dashboard-veterinario.html'));
    } else {
        res.redirect('/login.html');
    }
});

app.get('/dashboard-admin.html', (req, res) => {
    if (req.session.usuario && req.session.usuario.rol === 'admin') {
        res.sendFile(path.join(__dirname, 'views', 'dashboard-admin.html'));
    } else {
        res.redirect('/login.html');
    }
});

// Iniciar servidor
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`Servidor iniciado en http://localhost:${PORT}`);
});