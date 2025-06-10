require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
const appHelpers = require('./utils/helpers');

// For connection and routes
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const storyRoutes = require('./routes/storyRoutes');

connectDB();

const app = express();
const server = http.createServer(app);
const io = socketIo(server); // Attaching Socket.IO to the server

// Middleware - using EJS from what I learned in CSE340 so far
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// Session sepcific Middleware
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI })
}));

// When logged in this is necessary to make the user available everywhere.
app.use((req, res, next) => {
    res.locals.currentUser = req.session.userId;
    res.locals.currentUsername = req.session.username;
    res.locals.stringToColorForEJS = appHelpers.stringToColor;
    next();
});

// This is for Socket.io connection and event handlers
io.on('connection', (socket) => {
    console.log('New user connected:', socket.id);

    socket.on('join_story_room', (storyId) => {
        socket.join(storyId);
        console.log(`Socket ${socket.id} joined room ${storyId}`);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// So I can pass the io instance to the routes
app.use((req, res, next) => {
    req.io = io;
    next();
});


// Routes
app.use('/auth', authRoutes);   // User login authentication (not using OAuth, just simple auth for minor project)
app.use('/', storyRoutes);      // Story routes will be default landing page of the project

// Home route (redirect to login or stories, depending on login status)
app.get('/', (req, res) => {
    if (req.session.userId) {
        res.redirect('/stories');
    } else {
        res.redirect('/auth/login');
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));