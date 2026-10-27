import { createRequire } from 'node:module';
import { defineConfig } from 'vitest/config';

const require = createRequire(import.meta.url);

export default defineConfig({
  // Resolve graphql to the same entry point Node uses so that errors thrown in
  // resolvers are recognized as GraphQLError instances by graphql-yoga.
  resolve: { alias: { graphql: require.resolve('graphql') } },
});
