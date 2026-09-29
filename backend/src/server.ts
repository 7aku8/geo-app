import { buildApp } from './app.ts';
import { loadCities, type DataSource } from './cities.ts';

const port = Number(process.env.PORT ?? 3000);
const source: DataSource = process.env.DATA_SOURCE === 'local' ? 'local' : 'remote';
const username = process.env.GEONAMES_USERNAME ?? 'hsample';

const cities = await loadCities(source, username);
const app = buildApp(cities, { logger: true });
app.log.info(`Loaded ${cities.length} cities`);

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, async () => {
    await app.close();
    process.exit(0);
  });
}

await app.listen({ port, host: '0.0.0.0' });
