
const express = require('express');
require('dotenv').config();
const cors = require('cors');
const passport = require('passport');
const db = require('./db');
const authRoutes = require('./routes/auth').expressRouter;
const itemRoutes = require('./routes/items').expressRouter;
const groupRoutes = require('./routes/groups').expressRouter;
const storageRoutes = require('./routes/storage').expressRouter;
const { expressAuth } = require('./middleware/auth');

const app = express();

// Initialize DB
db.init();

// Middleware
app.use(cors());
app.use(express.json());
app.use(passport.initialize());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/items', expressAuth, itemRoutes);
app.use('/api/groups', expressAuth, groupRoutes);
app.use('/api/storage', expressAuth, storageRoutes);

app.get('/', (req, res) => {
    res.send('Pantry Pulse API is running!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
