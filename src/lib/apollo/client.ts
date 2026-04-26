import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";

let instance: ApolloClient | undefined;

export function getApolloClient(): ApolloClient {
  if (!instance) {
    instance = new ApolloClient({
      link: new HttpLink({
        uri: process.env.NEXT_PUBLIC_ERXES_ENDPOINT ?? process.env.NEXT_PUBLIC_GRAPHQL_URL ?? "/graphql",
        headers: {
          "x-app-token": process.env.NEXT_PUBLIC_ERXES_APP_TOKEN ?? "",
        },
      }),
      cache: new InMemoryCache(),
    });
  }
  return instance;
}
