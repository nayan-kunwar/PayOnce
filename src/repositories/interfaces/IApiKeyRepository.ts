import type { ApiKeyRow } from "../../db/schema.js";

export type CreateApiKeyRecord = {
  id: string;
  keyHash: string;
  keyPrefix: string;
  ownerEmail?: string;
  userId?: string;
  label?: string;
};

export interface IApiKeyRepository {
  save(data: CreateApiKeyRecord): Promise<ApiKeyRow>;
  findActiveByHash(keyHash: string): Promise<ApiKeyRow | null>;
  markUsed(id: string): Promise<void>;
  findByUserId(userId: string): Promise<ApiKeyRow[]>;
  revokeByIdAndUserId(id: string, userId: string): Promise<boolean>;
}
