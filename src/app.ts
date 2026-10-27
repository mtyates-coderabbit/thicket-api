import { readFileSync } from 'node:fs';
import { createSchema, createYoga } from 'graphql-yoga';
import { createStore, type Store } from './data/store';
import { resolvers, type Context } from './resolvers';

export const typeDefs = readFileSync(new URL('../schema/schema.graphql', import.meta.url), 'utf8');

export function createApp(store: Store = createStore()) {
  const schema = createSchema<Context>({ typeDefs, resolvers });
  return createYoga({
    schema,
    context: () => ({ store }),
    graphqlEndpoint: '/graphql',
    logging: process.env.NODE_ENV === 'test' ? false : 'info',
  });
}
