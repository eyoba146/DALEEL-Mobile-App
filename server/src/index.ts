import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import path from 'path';
import { authRouter } from './routes/auth';
import { verificationRouter } from './routes/verification';
import { contentRouter } from './routes/content';
import { favoritesRouter } from './routes/favorites';
import { notificationsRouter } from './routes/notifications';
import { adminRouter } from './routes/admin';
import { reviewsRouter } from './routes/reviews';

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Live Currency Exchange Rates endpoint with in-memory caching
let cachedCurrencyRates = {
  base: 'ETB',
  rates: {
    ETB: 1.0,
    USD: 0.006165,
    EUR: 0.005307,
    GBP: 0.004611,
    AED: 0.022724,
  },
  lastUpdated: new Date().toISOString(),
};
let lastCurrencyFetch = 0;
const CURRENCY_TTL_MS = 10 * 60 * 1000; // 10 minutes

app.get('/api/currency/rates', async (_req, res) => {
  const now = Date.now();
  if (now - lastCurrencyFetch > CURRENCY_TTL_MS) {
    try {
      const resp = await fetch('https://open.er-api.com/v6/latest/ETB');
      if (resp.ok) {
        const data: any = await resp.json();
        if (data && data.rates) {
          cachedCurrencyRates = {
            base: 'ETB',
            rates: {
              ETB: 1.0,
              USD: data.rates.USD || cachedCurrencyRates.rates.USD,
              EUR: data.rates.EUR || cachedCurrencyRates.rates.EUR,
              GBP: data.rates.GBP || cachedCurrencyRates.rates.GBP,
              AED: data.rates.AED || cachedCurrencyRates.rates.AED,
            },
            lastUpdated: data.time_last_update_utc || new Date().toISOString(),
          };
          lastCurrencyFetch = now;
        }
      }
    } catch (err) {
      console.warn('Currency rates live fetch error:', err);
    }
  }
  res.json(cachedCurrencyRates);
});

app.use('/api/auth', authRouter);
app.use('/api/auth', verificationRouter);
app.use('/api', contentRouter);
app.use('/api/favorites', favoritesRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/reviews', reviewsRouter);

// Central error handler — catches anything thrown in a route so the
// client always gets clean JSON instead of an HTML stack trace.
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on our end' });
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`DALEEL backend running on http://0.0.0.0:${PORT} (LAN: http://10.136.85.242:${PORT})`);
});
