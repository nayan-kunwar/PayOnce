import { randomUUID } from "node:crypto";

import { apiKeyRepository } from "../repositories/ApiKeyRepository.js";
import { generateApiKey, hashApiKey } from "../utils/apiKeys.js";

type CreateApiKeyResult = {
  id: string;
  apiKey: string;
  keyPrefix: string;
};

type ApiKeyAuthContext = {
  apiKeyId: string;
  userId: string | null;
};

class ApiKeyService {
  async createApiKey(email: string, label?: string): Promise<CreateApiKeyResult> {
    const { apiKey, keyHash, keyPrefix } = generateApiKey();
    const id = `key_${randomUUID()}`;

    await apiKeyRepository.save({
      id,
      keyHash,
      keyPrefix,
      ownerEmail: email,
      label,
    });

    return { id, apiKey, keyPrefix };
  }

  async createPersonalApiKey(
    userId: string,
    email: string,
    label?: string,
  ): Promise<CreateApiKeyResult> {
    const { apiKey, keyHash, keyPrefix } = generateApiKey();
    const id = `key_${randomUUID()}`;

    await apiKeyRepository.save({
      id,
      keyHash,
      keyPrefix,
      ownerEmail: email,
      userId,
      label,
    });

    return { id, apiKey, keyPrefix };
  }

  async validateApiKey(apiKey: string): Promise<ApiKeyAuthContext | null> {
    const keyHash = hashApiKey(apiKey);
    const keyRecord = await apiKeyRepository.findActiveByHash(keyHash);

    if (!keyRecord) {
      return null;
    }

    void apiKeyRepository.markUsed(keyRecord.id);
    return {
      apiKeyId: keyRecord.id,
      userId: keyRecord.userId ?? null,
    };
  }

  async listPersonalApiKeys(userId: string) {
    const rows = await apiKeyRepository.findByUserId(userId);
    return rows.map((row) => ({
      id: row.id,
      keyPrefix: row.keyPrefix,
      label: row.label,
      createdAt: row.createdAt,
      lastUsedAt: row.lastUsedAt,
      revokedAt: row.revokedAt,
    }));
  }

  async revokePersonalApiKey(userId: string, keyId: string): Promise<boolean> {
    return apiKeyRepository.revokeByIdAndUserId(keyId, userId);
  }
}

export const apiKeyService = new ApiKeyService();
