import { createApp } from '../src/app';
import { createStore, type Store } from '../src/data/store';

export interface GraphQLResponse<T = any> {
  data?: T;
  errors?: Array<{ message: string; extensions?: { code?: string } }>;
}

export function setup() {
  const store: Store = createStore();
  const yoga = createApp(store);

  async function execute<T = any>(query: string, variables?: Record<string, unknown>): Promise<GraphQLResponse<T>> {
    const response = await yoga.fetch('http://localhost/graphql', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    });
    return response.json();
  }

  return { store, execute };
}
