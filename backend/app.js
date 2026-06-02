require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./src/routes/authRoutes');
const productRoutes = require('./src/routes/productRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const settingsRoutes = require('./src/routes/settingsRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingsRoutes);

app.use(express.static(path.join(__dirname, '../frontend')));

app.use((req, res, next) => {
	if (req.path.startsWith('/api/')) {
		return next();
	}

	return res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

module.exports = app;