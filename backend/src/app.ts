import { fastify, type FastifyServerOptions } from 'fastify';
import { filterByLetter, type City } from './cities.ts';

interface CitiesQuery {
  letter: string;
}

export function buildApp(cities: readonly City[], opts: FastifyServerOptions = {}) {
  const app = fastify(opts);

  app.get('/health', async () => ({ status: 'ok' }));

  app.get<{ Querystring: CitiesQuery }>(
    '/cities',
    {
      schema: {
        querystring: {
          type: 'object',
          required: [ 'letter' ],
          properties: {
            letter: { type: 'string', pattern: '^\\p{L}$' }
          }
        }
      }
    },
    async (request) => {
      const { letter } = request.query;
      const matches = filterByLetter(cities, letter);

      return { letter, count: matches.length, cities: matches };
    }
  );

  return app;
}
