import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import path from 'path';
import { authRouter } from './routes/auth';
import { verificationRouter } from './routes/verification';
import { contentRouter } from './routes/content';
import { favoritesRouter } from './routes/favorites';
import { notificationsRouter } from './routes/notifications';

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRouter);
app.use('/api/auth', verificationRouter);
app.use('/api', contentRouter);
app.use('/api/favorites', favoritesRouter);
app.use('/api/notifications', notificationsRouter);

// Central error handler — catches anything thrown in a route so the
// client always gets clean JSON instead of an HTML stack trace.
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on our end' });
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`DALEEL backend running on http://0.0.0.0:${PORT} (LAN: http://10.240.1.242:${PORT})`);
});
