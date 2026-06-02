require('dotenv').config();

const fs = require('fs');
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

app.get('/api/health', (req, res) => {
	return res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingsRoutes);

const frontendDistPath = path.join(__dirname, '../frontend/dist');

if (fs.existsSync(frontendDistPath)) {
	app.use(express.static(frontendDistPath));
}

app.use((req, res, next) => {
	if (req.path.startsWith('/api/')) {
		return next();
	}

	if (!fs.existsSync(frontendDistPath)) {
		return res.status(503).json({
			message: 'Frontend build not found. Run npm --prefix frontend run build.'
		});
	}

	return res.sendFile(path.join(frontendDistPath, 'index.html'));
});

module.exports = app;