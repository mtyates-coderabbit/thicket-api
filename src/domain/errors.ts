import { GraphQLError } from 'graphql';

export function notFound(what: string, id: string): GraphQLError {
  return new GraphQLError(`${what} ${id} not found`, { extensions: { code: 'NOT_FOUND' } });
}

export function badInput(message: string): GraphQLError {
  return new GraphQLError(message, { extensions: { code: 'BAD_USER_INPUT' } });
}
