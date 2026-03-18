import { PluggyClient } from "pluggy-sdk";

const globalForPluggy = globalThis as unknown as {
  pluggy: PluggyClient | undefined;
};

function createPluggyClient() {
  return new PluggyClient({
    clientId: process.env.PLUGGY_CLIENT_ID!,
    clientSecret: process.env.PLUGGY_CLIENT_SECRET!,
  });
}

export const pluggy = globalForPluggy.pluggy ?? createPluggyClient();

if (process.env.NODE_ENV !== "production") globalForPluggy.pluggy = pluggy;
