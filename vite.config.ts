import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

function worldSavePlugin() {
  return {
    name: 'world-save',
    configureServer(server: any) {
      server.middlewares.use('/api/save-world', (req: any, res: any) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end('Method not allowed'); return; }
        let body = '';
        req.on('data', (chunk: string) => { body += chunk; });
        req.on('end', () => {
          try {
            const data = JSON.parse(body);
            const worldId = (data.worldId ?? 'cozy-startup').replace(/[^a-zA-Z0-9_-]/g, '');
            delete data.worldId;
            const worldDir = path.resolve(process.cwd(), 'public/worlds', worldId);
            fs.mkdirSync(worldDir, { recursive: true });
            const filePath = path.join(worldDir, 'world.json');
            let existing: Record<string, unknown> = {};
            if (fs.existsSync(filePath)) {
              try { existing = JSON.parse(fs.readFileSync(filePath, 'utf-8')); } catch {}
            }
            fs.writeFileSync(filePath, JSON.stringify({ ...existing, ...data }, null, 2) + '\n');
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: true }));
          } catch (e: any) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: e.message }));
          }
        });
      });
    },
  };
}

function tilesListPlugin() {
  return {
    name: 'tiles-list',
    configureServer(server: any) {
      server.middlewares.use('/api/tiles', (req: any, res: any) => {
        const url = new URL(req.url, 'http://localhost');
        const worldId = (url.searchParams.get('worldId') || '').replace(/[^a-zA-Z0-9_-]/g, '');
        const tilesDir = worldId
          ? path.resolve(process.cwd(), 'public/worlds', worldId, 'world_assets/tiles')
          : path.resolve(process.cwd(), 'public/universal_assets/tiles');
        const names = fs.existsSync(tilesDir)
          ? fs.readdirSync(tilesDir).filter((f: string) => f.endsWith('.png')).map((f: string) => f.replace('.png', ''))
          : [];
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(names));
      });
    },
  };
}

function citizensListPlugin() {
  return {
    name: 'citizens-list',
    configureServer(server: any) {
      server.middlewares.use('/api/citizens', (_req: any, res: any) => {
        const citizensDir = path.resolve(process.cwd(), 'public/universal_assets/citizens');
        const names = fs.existsSync(citizensDir)
          ? fs.readdirSync(citizensDir).filter((f: string) => f.endsWith('_walk.png')).map((f: string) => f.replace('_walk.png', ''))
          : [];
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(names));
      });
    },
  };
}

export default defineConfig({
  plugins: [worldSavePlugin(), tilesListPlugin(), citizensListPlugin()],
  server: {
    proxy: {
      '/api/agents': 'http://localhost:4321',
      '/api/heartbeat': 'http://localhost:4321',
      '/api/info': 'http://localhost:4321',
      '/ws': { target: 'ws://localhost:4321', ws: true },
    },
  },
});
