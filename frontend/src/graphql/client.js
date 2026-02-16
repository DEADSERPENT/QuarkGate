import { ApolloClient, ApolloLink, InMemoryCache, HttpLink, Observable, split } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { getMainDefinition } from '@apollo/client/utilities';
import { print } from 'graphql';
import keycloak from '../auth/keycloak';

const GRAPHQL_URL = 'http://localhost:8080/graphql';

const httpLink = new HttpLink({ uri: GRAPHQL_URL });

// Auth link: attach Bearer token if authenticated
const authLink = setContext((_, { headers }) => {
  const token = keycloak.authenticated ? keycloak.token : null;
  return {
    headers: {
      ...headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
});

// Custom SSE link for SmallRye GraphQL subscriptions
class SSELink extends ApolloLink {
  request(operation) {
    const query = print(operation.query);
    const variables = operation.variables || {};
    const token = keycloak.authenticated ? keycloak.token : null;

    return new Observable((observer) => {
      const abortController = new AbortController();

      fetch(GRAPHQL_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ query, variables }),
        signal: abortController.signal,
      })
        .then(async (response) => {
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data:')) {
                try {
                  const data = JSON.parse(line.slice(5).trim());
                  observer.next({ data: data.data || data });
                } catch {
                  // skip malformed SSE data
                }
              }
            }
          }
          observer.complete();
        })
        .catch((err) => {
          if (err.name !== 'AbortError') {
            observer.error(err);
          }
        });

      return () => abortController.abort();
    });
  }
}

const sseLink = new SSELink();

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  sseLink,
  authLink.concat(httpLink)
);

const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: { fetchPolicy: 'cache-and-network' },
    query: { fetchPolicy: 'network-only' },
  },
});

export default client;
