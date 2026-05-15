require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

console.log('Uploads folder:', path.join(__dirname, 'uploads'));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/complaints', require('./routes/complaints'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/dept', require('./routes/department'));
app.use('/api/areas', require('./routes/areas'));

// Catch-all: serve index.html for any non-API route
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
});

// Final Error Handler
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err);

    res.status(err.status || 500).json({
        error: err.message || 'An unexpected error occurred on the server.'
    });
});

const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Trying port ${Number(PORT) + 1}...`);
        app.listen(Number(PORT) + 1, () => {
            console.log(`Server running on http://localhost:${Number(PORT) + 1}`);
        });
    } else {
        console.error('Server error:', error);
        process.exit(1);
    }
});

// Robust Crash Prevention
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    if (error.code === 'EADDRINUSE') return; // handled by server.on('error')
    console.error('Uncaught Exception:', error);
});