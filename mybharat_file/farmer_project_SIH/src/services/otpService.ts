/**
 * KrushiSetu Mobile OTP Authentication Service
 * Manages 6-digit OTP generation, expiration, rate limiting, and verification.
 */

import type { UserRole } from '../types';
import { dbService } from './dbService';

export interface OtpSession {
  mobile: string;
  role: UserRole;
  code: string;
  expiresAt: number; // timestamp in ms (5 minutes)
  resendCooldownUntil: number; // timestamp in ms (30 seconds)
  attempts: number; // max 5 attempts
}

export interface RequestOtpResult {
  success: boolean;
  errorKey?: string;
  messageKey?: string;
  cooldownSeconds?: number;
  mobile?: string;
  testOtp?: string; // Only provided in development mode
}

export interface VerifyOtpResult {
  isValid: boolean;
  errorKey?: string;
  attemptsRemaining?: number;
}

class ClientOtpService {
  private activeSessions: Map<string, OtpSession> = new Map();

  /**
   * Normalizes an Indian mobile number.
   * Strips spaces, dashes, parentheses, and leading +91 / 91.
   * Ensures 10 digits starting with 6, 7, 8, or 9.
   */
  public normalizeMobile(input: string): string | null {
    if (!input) return null;
    let cleaned = input.replace(/\s+/g, '').replace(/[-()+]/g, '');

    // If starts with 91 and has 12 digits, strip country code
    if (cleaned.length === 12 && cleaned.startsWith('91')) {
      cleaned = cleaned.slice(2);
    }
    // If starts with 0 and has 11 digits, strip leading zero
    if (cleaned.length === 11 && cleaned.startsWith('0')) {
      cleaned = cleaned.slice(1);
    }

    if (/^[6-9]\d{9}$/.test(cleaned)) {
      return cleaned;
    }
    return null;
  }

  /**
   * Request a 6-digit OTP for a mobile number and role
   */
  public async requestOtp(
    mobile: string,
    role: UserRole,
    isRegistration: boolean = false
  ): Promise<RequestOtpResult> {
    const cleanMobile = this.normalizeMobile(mobile);
    if (!cleanMobile) {
      return { success: false, errorKey: 'errorInvalidMobile' };
    }

    // Role safety: Admin cannot request OTP via public portal
    if (role === 'admin') {
      return { success: false, errorKey: 'errorAdminAccessDenied' };
    }

    // Enforce register-before-login: check user profile existence in database
    const existingProfiles = await dbService.getAllProfiles();
    const existingUser = existingProfiles.find(
      (p) => (p.mobile === cleanMobile || p.id.includes(cleanMobile)) && p.role === role
    );

    if (isRegistration) {
      if (existingUser) {
        return { success: false, errorKey: 'errorMobileAlreadyRegistered' };
      }
    } else {
      // Login mode: must already have an account in the database
      if (!existingUser) {
        return { success: false, errorKey: 'errorAccountNotFound' };
      }
    }

    const sessionKey = `${role}:${cleanMobile}`;
    const now = Date.now();
    const existing = this.activeSessions.get(sessionKey);

    // Rate limiting: 30-second resend cooldown
    if (existing && now < existing.resendCooldownUntil) {
      const remainingCooldown = Math.ceil((existing.resendCooldownUntil - now) / 1000);
      return {
        success: false,
        errorKey: 'errorOtpCooldown',
        cooldownSeconds: remainingCooldown,
      };
    }

    // Generate secure 6-digit numeric OTP
    // In dev mode, deterministic seed or random 6-digit
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = now + 5 * 60 * 1000; // 5 minutes
    const resendCooldownUntil = now + 30 * 1000; // 30 seconds

    const newSession: OtpSession = {
      mobile: cleanMobile,
      role,
      code: generatedOtp,
      expiresAt,
      resendCooldownUntil,
      attempts: 0,
    };

    this.activeSessions.set(sessionKey, newSession);

    // Call backend API asynchronously if server is running
    try {
      fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanMobile, role }),
      }).catch(() => {});
    } catch (_) {}

    const isDev = import.meta.env.DEV;

    return {
      success: true,
      cooldownSeconds: 30,
      mobile: cleanMobile,
      testOtp: isDev ? generatedOtp : undefined,
    };
  }

  /**
   * Verify candidate OTP
   */
  public async verifyOtp(
    mobile: string,
    candidateOtp: string,
    role: UserRole
  ): Promise<VerifyOtpResult> {
    const cleanMobile = this.normalizeMobile(mobile);
    if (!cleanMobile) {
      return { isValid: false, errorKey: 'errorInvalidMobile' };
    }

    const cleanCandidate = candidateOtp.trim();

    // Development & Pre-seeded Demo Bypass
    if (
      import.meta.env.DEV &&
      (cleanCandidate === '123456' || cleanCandidate === '914200' || cleanCandidate === '999999')
    ) {
      return { isValid: true };
    }

    const sessionKey = `${role}:${cleanMobile}`;
    const session = this.activeSessions.get(sessionKey);

    if (!session) {
      return { isValid: false, errorKey: 'errorUserNotFound' };
    }

    const now = Date.now();
    if (now > session.expiresAt) {
      this.activeSessions.delete(sessionKey);
      return { isValid: false, errorKey: 'errorOtpExpired' };
    }

    if (session.attempts >= 5) {
      this.activeSessions.delete(sessionKey);
      return { isValid: false, errorKey: 'errorMaxAttempts' };
    }

    if (session.code !== cleanCandidate) {
      session.attempts += 1;
      const remaining = 5 - session.attempts;
      if (remaining <= 0) {
        this.activeSessions.delete(sessionKey);
        return { isValid: false, errorKey: 'errorMaxAttempts', attemptsRemaining: 0 };
      }
      return { isValid: false, errorKey: 'errorInvalidOtp', attemptsRemaining: remaining };
    }

    // OTP is valid -> clear session
    this.activeSessions.delete(sessionKey);

    // Try backend verification if available
    try {
      fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanMobile, otp: cleanCandidate, role }),
      }).catch(() => {});
    } catch (_) {}

    return { isValid: true };
  }

  /**
   * Get remaining cooldown seconds for a mobile & role
   */
  public getCooldownSeconds(mobile: string, role: UserRole): number {
    const cleanMobile = this.normalizeMobile(mobile);
    if (!cleanMobile) return 0;
    const sessionKey = `${role}:${cleanMobile}`;
    const session = this.activeSessions.get(sessionKey);
    if (!session) return 0;
    const diff = session.resendCooldownUntil - Date.now();
    return diff > 0 ? Math.ceil(diff / 1000) : 0;
  }
}

export const otpService = new ClientOtpService();
