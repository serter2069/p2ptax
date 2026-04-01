import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3812;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    project: 'p2ptax',
    timestamp: new Date().toISOString(),
  });
});

// Version endpoint
app.get('/api/version', (_req, res) => {
  res.json({
    version: process.env.npm_package_version || '1.0.0',
    commit: process.env.COMMIT_SHA || 'local',
  });
});

app.listen(PORT, () => {
  console.log(`P2PTax API running on port ${PORT}`);
});

export default app;
