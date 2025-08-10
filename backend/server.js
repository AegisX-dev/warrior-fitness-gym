const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectToDb = require('./db');
const userRoutes = require('./routes/user.routes');
const memberRoutes = require('./routes/member.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();
const port = 3000;

// Connect to database
connectToDb();

// Middleware
app.use(cors({
    origin: ['http://localhost:3001', 'http://127.0.0.1:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
    res.send('Hello from your Node.js backend!');
});

app.use('/api/users', userRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/admin', adminRoutes);

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});