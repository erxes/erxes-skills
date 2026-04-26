import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";

export async function getServerApolloClient() {
  return new ApolloClient({
    link: new HttpLink({
      uri:
        process.env.NEXT_PUBLIC_ERXES_ENDPOINT ??
        process.env.NEXT_PUBLIC_GRAPHQL_URL ??
        "/graphql",
      headers: {
        "x-app-token": process.env.ERXES_APP_TOKEN ?? "",
      },
      fetchOptions: { cache: "no-store" },
    }),
    cache: new InMemoryCache(),
  });
}
