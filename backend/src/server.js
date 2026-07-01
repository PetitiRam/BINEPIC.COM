import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
dotenv.config();

import authRoutes from './routes/auth.js';
import upgradeRoutes from './routes/upgrade.js';
import shopRoutes from './routes/shops.js';
import productRoutes from './routes/products.js';
import templateRoutes from './routes/templates.js';
import notificationRoutes from './routes/notifications.js';
import shareLinkPreviewRoutes from './routes/shareLinkPreview.js';
import orderRoutes from './routes/orders.js';
import walletRoutes from './routes/wallets.js';
import adminRoutes from './routes/admin.js';
import adsRoutes from './routes/ads.js';
import publicSettingsRoutes from './routes/publicSettings.js';
import chatRoutes from './routes/chat.js';
import deliveryRoutes from './routes/deliveryRoutes.js';
import petitiRoutes from '../ai/petiti/petitiRoutes.js';
import tausiRoutes from '../ai/tausi/tausiRoutes.js';
import publicPetitiRoutes from './routes/publicPetiti.js';
console.log('ACCESS SECRET LOADED:', !!process.env.JWT_ACCESS_SECRET);
console.log('REFRESH SECRET LOADED:', !!process.env.JWT_REFRESH_SECRET);

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { error: 'Too many attempts. Please try again later.' }
});

// Root-level route (not under /api): this is the actual link sellers share
// on social media — it serves Open Graph meta tags for crawlers, then
// redirects real visitors into the SPA. See routes/shareLinkPreview.js.
app.use(shareLinkPreviewRoutes);

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/upgrade', upgradeRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/products', productRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/wallets', walletRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ads', adsRoutes);
app.use('/api/settings', publicSettingsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/ai/petiti', petitiRoutes);
app.use('/api/ai/tausi', tausiRoutes);
app.use('/api/site', publicPetitiRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'JEDIDA Marketplace API', phase: 4 });
});
app.use((req, res, next) => {
  console.log("REQUEST:", req.method, req.url);
  next();
});
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on our end.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🟢 JEDIDA Marketplace API running on http://localhost:${PORT}`);
});
