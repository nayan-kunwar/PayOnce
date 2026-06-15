import { ConflictError, UnauthorizedError } from "../errors/AppError.js";
import { sessionRepository } from "../repositories/SessionRepository.js";
import { userRepository } from "../repositories/UserRepository.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { generateSessionToken, hashSessionToken } from "../utils/sessionTokens.js";
import { env } from "../config/env.js";

type PublicUser = {
  id: string;
  email: string;
  name?: string | null;
};

type AuthResult = {
  user: PublicUser;
  sessionToken: string;
};

class AuthService {
  private toPublicUser(user: { id: string; email: string; name?: string | null }): PublicUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name ?? null,
    };
  }

  private getSessionExpiry(): Date {
    return new Date(Date.now() + env.SESSION_TTL_HOURS * 60 * 60 * 1000);
  }

  async signup(email: string, password: string, name?: string): Promise<AuthResult> {
    const existing = await userRepository.findByEmail(email);
    if (existing) {
      throw new ConflictError("An account with this email already exists");
    }

    const passwordHash = await hashPassword(password);
    const user = await userRepository.create({ email, passwordHash, name });
    const sessionToken = generateSessionToken();

    await sessionRepository.create({
      userId: user.id,
      tokenHash: hashSessionToken(sessionToken),
      expiresAt: this.getSessionExpiry(),
    });
    await userRepository.markLogin(user.id);

    return {
      user: this.toPublicUser(user),
      sessionToken,
    };
  }

  async login(email: string, password: string): Promise<AuthResult> {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const sessionToken = generateSessionToken();
    await sessionRepository.create({
      userId: user.id,
      tokenHash: hashSessionToken(sessionToken),
      expiresAt: this.getSessionExpiry(),
    });
    await userRepository.markLogin(user.id);

    return {
      user: this.toPublicUser(user),
      sessionToken,
    };
  }

  async logout(sessionToken: string): Promise<void> {
    await sessionRepository.revokeByTokenHash(hashSessionToken(sessionToken));
  }

  async getUserBySessionToken(sessionToken: string): Promise<PublicUser | null> {
    const session = await sessionRepository.findActiveByTokenHash(
      hashSessionToken(sessionToken),
    );
    if (!session) {
      return null;
    }

    const user = await userRepository.findById(session.userId);
    if (!user) {
      return null;
    }

    return this.toPublicUser(user);
  }
}

export const authService = new AuthService();
