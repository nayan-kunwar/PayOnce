import { createHash, randomBytes } from "node:crypto";

export const API_KEY_PREFIX_LENGTH = 14;

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export function generateApiKey(): {
  apiKey: string;
  keyHash: string;
  keyPrefix: string;
} {
  const apiKey = `pk_live_${randomBytes(24).toString("base64url")}`;
  const keyHash = hashApiKey(apiKey);
  const keyPrefix = apiKey.slice(0, API_KEY_PREFIX_LENGTH);

  return { apiKey, keyHash, keyPrefix };
}
