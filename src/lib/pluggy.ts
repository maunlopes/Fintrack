import { PluggyClient } from "pluggy-sdk";

let _client: PluggyClient | undefined;

function getPluggyClient(): PluggyClient {
  if (!_client) {
    _client = new PluggyClient({
      clientId: process.env.PLUGGY_CLIENT_ID!,
      clientSecret: process.env.PLUGGY_CLIENT_SECRET!,
    });
  }
  return _client;
}

export const pluggy = new Proxy({} as PluggyClient, {
  get(_, prop: string) {
    return (getPluggyClient() as unknown as Record<string, unknown>)[prop];
  },
});
