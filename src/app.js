const initServer = require('./config/server');
const connectDB = require('./config/db');
const { env } = require('./config/env');
const userRoutes = require('./routes/userRoutes');
const { notFound, converter, handler, celebrateErrors } = require('./utils/errorHandler');
const logger = require('./utils/logger');

const app = initServer();
connectDB();

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Routes
app.use('/api/users', userRoutes);

// Celebrate validation errors first, then our converters/handlers
app.use(celebrateErrors());
app.use(notFound);
app.use(converter);
app.use(handler);

const PORT = env.PORT;
app.listen(PORT, () => logger.info(`🚀 Server running on port ${PORT}`));

module.exports = app; // for tests
