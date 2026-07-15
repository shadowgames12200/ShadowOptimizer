/**
 * Shared types for ShadowOptimizer
 */

export type ValidationResult = {
  authorized: boolean;
  message: string;
  licenseKey?: string;
  expiresAt?: string;
  boundHwid?: string;
};

export type LicenseStats = {
  total: number;
  active: number;
  expired: number;
  revoked: number;
  deniedAttempts: number;
};

export type AccessLogEntry = {
  id: number;
  licenseId: number;
  hwid: string;
  result: "success" | "invalid_key" | "invalid_hwid" | "revoked" | "expired" | "not_activated";
  requestSource?: string;
  createdAt: Date;
};

export type LicenseInfo = {
  id: number;
  key: string;
  status: "active" | "revoked" | "expired";
  expiresAt?: Date;
  boundHwid?: string;
  activated: number;
  createdByUserId: number;
  createdAt: Date;
  updatedAt: Date;
};
