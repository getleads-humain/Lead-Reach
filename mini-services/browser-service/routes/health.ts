import { Router } from 'express';

const router = Router();

router.get('/', (_req, res) => {
  const uptime = process.uptime();
  res.json({
    status: 'ok',
    tools: ['puppeteer', 'crawlee'],
    uptime: Math.round(uptime),
  });
});

export { router as healthRouter };
