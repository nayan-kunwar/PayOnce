/**
 * pg v8 treats sslmode=require as verify-full but emits a deprecation warning.
 * Normalize legacy Neon URLs to explicit verify-full.
 */
export function resolvePgConnectionString(connectionString: string): string {
  return connectionString.replace(
    /([?&])sslmode=(require|prefer|verify-ca)(?=&|$)/i,
    "$1sslmode=verify-full",
  );
}
