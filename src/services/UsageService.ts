import { usageRepository } from "../repositories/UsageRepository.js";

type UsageEventInput = {
  userId?: string | null;
  apiKeyId?: string | null;
  method: string;
  path: string;
  statusCode: number;
  latencyMs: number;
};

class UsageService {
  async track(event: UsageEventInput): Promise<void> {
    if (!event.apiKeyId || !event.userId) {
      return;
    }

    await usageRepository.create(event);
  }

  async getSummary(userId: string) {
    return usageRepository.getSummaryByUserId(userId);
  }

  async getRecent(userId: string) {
    return usageRepository.getRecentByUserId(userId);
  }

  async getByKey(userId: string) {
    return usageRepository.getByKeyForUser(userId);
  }
}

export const usageService = new UsageService();
