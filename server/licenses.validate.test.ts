import { describe, expect, it, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

// Mock the database functions
vi.mock("./db", () => ({
  getLicenseByKey: vi.fn(),
  logAccessAttempt: vi.fn(),
  bindHwidToLicense: vi.fn(),
}));

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: { "x-forwarded-for": "192.168.1.1" },
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("licenses.validate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns unauthorized for invalid license key", async () => {
    vi.mocked(db.getLicenseByKey).mockResolvedValue(undefined);
    vi.mocked(db.logAccessAttempt).mockResolvedValue(undefined);

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.licenses.validate({
      key: "INVALID-KEY",
      hwid: "test-hwid-123",
    });

    expect(result.authorized).toBe(false);
    expect(result.message).toContain("Invalid license key");
    expect(db.logAccessAttempt).toHaveBeenCalledWith(
      0,
      "test-hwid-123",
      "invalid_key",
      "192.168.1.1"
    );
  });

  it("returns unauthorized for revoked license", async () => {
    const mockLicense = {
      id: 1,
      key: "SHADOW-TEST-0001",
      status: "revoked" as const,
      expiresAt: null,
      boundHwid: null,
      activated: 0,
      createdByUserId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(db.getLicenseByKey).mockResolvedValue(mockLicense);
    vi.mocked(db.logAccessAttempt).mockResolvedValue(undefined);

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.licenses.validate({
      key: "SHADOW-TEST-0001",
      hwid: "test-hwid-123",
    });

    expect(result.authorized).toBe(false);
    expect(result.message).toContain("revoked");
    expect(db.logAccessAttempt).toHaveBeenCalledWith(
      1,
      "test-hwid-123",
      "revoked",
      "192.168.1.1"
    );
  });

  it("activates license and binds HWID on first use", async () => {
    const mockLicense = {
      id: 1,
      key: "SHADOW-TEST-0001",
      status: "active" as const,
      expiresAt: null,
      boundHwid: null,
      activated: 0,
      createdByUserId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(db.getLicenseByKey).mockResolvedValue(mockLicense);
    vi.mocked(db.bindHwidToLicense).mockResolvedValue(undefined);
    vi.mocked(db.logAccessAttempt).mockResolvedValue(undefined);

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.licenses.validate({
      key: "SHADOW-TEST-0001",
      hwid: "test-hwid-123",
    });

    expect(result.authorized).toBe(true);
    expect(result.message).toContain("activated");
    expect(result.boundHwid).toBe("test-hwid-123");
    expect(db.bindHwidToLicense).toHaveBeenCalledWith(1, "test-hwid-123");
    expect(db.logAccessAttempt).toHaveBeenCalledWith(
      1,
      "test-hwid-123",
      "success",
      "192.168.1.1"
    );
  });

  it("returns unauthorized for mismatched HWID", async () => {
    const mockLicense = {
      id: 1,
      key: "SHADOW-TEST-0001",
      status: "active" as const,
      expiresAt: null,
      boundHwid: "original-hwid",
      activated: 1,
      createdByUserId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(db.getLicenseByKey).mockResolvedValue(mockLicense);
    vi.mocked(db.logAccessAttempt).mockResolvedValue(undefined);

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.licenses.validate({
      key: "SHADOW-TEST-0001",
      hwid: "different-hwid",
    });

    expect(result.authorized).toBe(false);
    expect(result.message).toContain("HWID does not match");
    expect(db.logAccessAttempt).toHaveBeenCalledWith(
      1,
      "different-hwid",
      "invalid_hwid",
      "192.168.1.1"
    );
  });

  it("returns authorized for valid license with matching HWID", async () => {
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const mockLicense = {
      id: 1,
      key: "SHADOW-TEST-0001",
      status: "active" as const,
      expiresAt,
      boundHwid: "test-hwid-123",
      activated: 1,
      createdByUserId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(db.getLicenseByKey).mockResolvedValue(mockLicense);
    vi.mocked(db.logAccessAttempt).mockResolvedValue(undefined);

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.licenses.validate({
      key: "SHADOW-TEST-0001",
      hwid: "test-hwid-123",
    });

    expect(result.authorized).toBe(true);
    expect(result.message).toContain("valid");
    expect(result.boundHwid).toBe("test-hwid-123");
    expect(db.logAccessAttempt).toHaveBeenCalledWith(
      1,
      "test-hwid-123",
      "success",
      "192.168.1.1"
    );
  });
});
