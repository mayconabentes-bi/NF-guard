import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

import nfeRoutes from './routes/nfeRoutes.js';
import unitRoutes from './routes/unitRoutes.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/nfe', nfeRoutes);
app.use('/api/units', unitRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// TODO: Import and use routes here

export default app;
