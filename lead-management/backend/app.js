const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const logger = require('./src/config/logger');

const app = express();

// 1. Core Security Middlewares
app.use(helmet());

const corsOptions = {
  origin: (origin, callback) => {
    // In production, configure strict origin matching. 
    // Allow empty origin (like curl or postman requests in dev)
    const allowedOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
    if (!origin || origin === allowedOrigin) {
      callback(null, true);
    } else {
      callback(new Error('Blocked by CORS policy'));
    }
  },
  credentials: true,
};
app.use(cors(corsOptions));

// 2. Request Logging Middleware (Morgan streaming to Winston)
// Using 'combined' or 'dev' format based on environment
const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(morganFormat, { stream: logger.stream }));

// 3. Parser Middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// 4. Health Check Endpoint
app.get('/health', async (req, res, next) => {
  try {
    const db = require('./src/database');
    const start = Date.now();
    
    // Execute a simple query to verify database responsiveness
    await db.query('SELECT 1');
    const latency = Date.now() - start;

    return res.status(200).json({
      status: 'UP',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database: {
          status: 'UP',
          latencyMs: latency
        }
      }
    });
  } catch (error) {
    logger.error('Health check failed', error);
    return res.status(503).json({
      status: 'DOWN',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database: {
          status: 'DOWN',
          error: process.env.NODE_ENV === 'development' ? error.message : 'Database connection error'
        }
      }
    });
  }
});

// Register authentication routes
const authRoutes = require('./src/auth/routes/authRoutes');
app.use('/api/v1/auth', authRoutes);

// Register AI assistant routes (unprotected for now)
const aiRoutes = require('./src/ai/ai.routes');
app.use('/api/v1/ai-assistant', aiRoutes);

// --- PROTECTED ROUTES ---
// --- PROTECTED ROUTES ---
const { authenticate, tenantGuard } = require('./src/auth/middlewares/authMiddleware');
const protectedRouter = express.Router();

// Register branch routes
const branchRoutes = require('./src/branches/routes/branchRoutes');
protectedRouter.use('/branches', authenticate, tenantGuard, branchRoutes);

// Register team routes
const teamsRouter = require('./src/teams/routes/teamRoutes');
const teamLeadersRouter = require('./src/teams/routes/teamLeaderRoutes');
protectedRouter.use('/teams', authenticate, tenantGuard, teamsRouter);
protectedRouter.use('/team-leaders', authenticate, tenantGuard, teamLeadersRouter);

// Register developer routes
const developerRoutes = require('./src/developers/routes/developerRoutes');
protectedRouter.use('/developers', authenticate, tenantGuard, developerRoutes);

// Register lead routes
const leadRoutes = require('./src/leads/routes/leadRoutes');
protectedRouter.use('/leads', authenticate, tenantGuard, leadRoutes);

// Register dashboard routes
const dashboardRoutes = require('./src/modules/dashboard/routes/dashboardRoutes');
protectedRouter.use('/dashboard', authenticate, tenantGuard, dashboardRoutes);

// Register reports routes
const reportsRoutes = require('./src/modules/reports/routes/reportsRoutes');
protectedRouter.use('/reports', authenticate, tenantGuard, reportsRoutes);

// Register standalone notes routes
const notesRoutes = require('./src/leads/routes/notesRoutes');
protectedRouter.use('/notes', authenticate, tenantGuard, notesRoutes);

// Register standalone communications routes
const communicationsRoutes = require('./src/leads/routes/communicationsRoutes');
protectedRouter.use('/communications', authenticate, tenantGuard, communicationsRoutes);

// Register standalone followups routes
const followupsRoutes = require('./src/leads/routes/followupsRoutes');
protectedRouter.use('/followups', authenticate, tenantGuard, followupsRoutes);

// Register standalone requirements routes
const requirementsRoutes = require('./src/leads/routes/requirementsRoutes');
protectedRouter.use('/requirements', authenticate, tenantGuard, requirementsRoutes);

// Register standalone proposals routes
const proposalsRoutes = require('./src/leads/routes/proposalsRoutes');
protectedRouter.use('/proposals', authenticate, tenantGuard, proposalsRoutes);

// Register standalone projects routes
const projectsRoutes = require('./src/leads/routes/projectsRoutes');
protectedRouter.use('/projects', authenticate, tenantGuard, projectsRoutes);

// Register standalone delivery routes
const deliveryRoutes = require('./src/leads/routes/deliveryRoutes');
protectedRouter.use('/delivery', authenticate, tenantGuard, deliveryRoutes);

// Register standalone customer success routes
const customerSuccessRoutes = require('./src/leads/routes/customerSuccessRoutes');
protectedRouter.use('/customer-success', authenticate, tenantGuard, customerSuccessRoutes);

// Register tasks routes
const taskRoutes = require('./src/tasks/routes/taskRoutes');
protectedRouter.use('/tasks', authenticate, tenantGuard, taskRoutes);

// Register accounting routes
const accountingRoutes = require('./src/accounting/routes/accountingRoutes');
protectedRouter.use('/accounting', authenticate, tenantGuard, accountingRoutes);

// Mount the protected router to /api/v1
app.use('/api/v1', protectedRouter);
// -----------------------

// 5. Fallback 404 handler for unmatched routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Cannot ${req.method} ${req.originalUrl}`
    }
  });
});

// 6. Global Error Handling Middleware
app.use((err, req, res, next) => {
  logger.error(`${req.method} ${req.originalUrl} - Error: ${err.message}`, err);

  const fs = require('fs');
  if (err) {
    try {
      fs.appendFileSync('global_error.log', new Date().toISOString() + ' ' + req.method + ' ' + req.url + ' ' + err.stack + '\n');
    } catch (fsErr) {
      logger.error('Failed to write to global_error.log', fsErr);
    }
  }
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || err.name || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

module.exports = app;
