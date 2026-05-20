import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { rateLimit } from 'elysia-rate-limit';
import { connectDB } from './db';
import { drawRoutes } from './routes/draw';
import { xRoutes } from './routes/x';

const PORT = 7860;

const ALLOWED_ORIGINS = [
  'https://fairgiveaway.online',
  'http://localhost:3000',
];

// Derive client IP from common proxy headers for rate limiting
function extractClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') || '127.0.0.1';
}

async function main(): Promise<void> {
  await connectDB();

  const app = new Elysia()
    .use(cors({ origin: ALLOWED_ORIGINS }))
    .use(
      swagger({
        provider: 'scalar',
        path: '/docs',
        documentation: {
          info: { title: 'FairGiveaway API', version: '1.0.0' },
        },
      })
    )
    // Rate limit only the expensive scrape endpoint: 3 requests per 15 min
    .guard(
      (app) =>
        app
          .use(
            rateLimit({
              max: 3,
              duration: 15 * 60 * 1000,
              generator: (req) => extractClientIp(req),
            })
          )
          .use(xRoutes())
    )
    .use(drawRoutes())
    .get('/api/health-check-xyz-9912', () => 'OK')
    .get('/', () => ({
      name: 'FairGiveaway API',
      version: '1.0.0',
      docs: '/docs',
    }))
    .listen(PORT);

  console.log(`🎲 FairGiveaway API running at http://localhost:${app.server?.port}`);
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
