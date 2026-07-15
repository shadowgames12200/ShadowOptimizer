
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { authRouter } from "./auth";
import * as db from "./db";
import { createLicenseProcedure, revokeLicenseProcedure, deleteLicenseProcedure } from "./licenses.create";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: authRouter,


  // Licensing system routers
  licenses: router({
    /**
     * Public endpoint for validating license keys
     * Accepts: key (license key) and hwid (hardware ID)
     * Returns: authorization status and license info
     */
    validate: publicProcedure
      .input((val: unknown) => {
        if (typeof val !== "object" || val === null) throw new Error("Invalid input");
        const obj = val as Record<string, unknown>;
        if (typeof obj.key !== "string") throw new Error("key must be a string");
        if (typeof obj.hwid !== "string") throw new Error("hwid must be a string");
        return { key: obj.key, hwid: obj.hwid };
      })
      .mutation(async ({ input, ctx }) => {
        const { key, hwid } = input;
        const requestSource = ctx.req.headers["x-forwarded-for"] as string | undefined;

        try {
          // Get license by key
          const license = await db.getLicenseByKey(key);
          if (!license) {
            await db.logAccessAttempt(0, hwid, "invalid_key", requestSource);
            return {
              authorized: false,
              message: "Invalid license key",
            };
          }

          // Check if license is revoked
          if (license.status === "revoked") {
            await db.logAccessAttempt(license.id, hwid, "revoked", requestSource);
            return {
              authorized: false,
              message: "License has been revoked",
            };
          }

          // Check if license is expired
          if (license.status === "expired" || (license.expiresAt && new Date() > license.expiresAt)) {
            await db.logAccessAttempt(license.id, hwid, "expired", requestSource);
            return {
              authorized: false,
              message: "License has expired",
            };
          }

          // If not activated yet, bind HWID and activate
          if (!license.activated) {
            await db.bindHwidToLicense(license.id, hwid);
            await db.logAccessAttempt(license.id, hwid, "success", requestSource);
            return {
              authorized: true,
              message: "License activated successfully",
              licenseKey: license.key,
              expiresAt: license.expiresAt?.toISOString(),
              boundHwid: hwid,
            };
          }

          // Check if HWID matches
          if (license.boundHwid !== hwid) {
            await db.logAccessAttempt(license.id, hwid, "invalid_hwid", requestSource);
            return {
              authorized: false,
              message: "HWID does not match the bound hardware",
            };
          }

          // All checks passed
          await db.logAccessAttempt(license.id, hwid, "success", requestSource);
          return {
            authorized: true,
            message: "License is valid",
            licenseKey: license.key,
            expiresAt: license.expiresAt?.toISOString(),
            boundHwid: license.boundHwid,
          };
        } catch (error) {
          console.error("[License Validation Error]", error);
          return {
            authorized: false,
            message: "Validation service error",
          };
        }
      }),

    /**
     * Admin: List all licenses for the current user
     */
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getLicensesByUser(ctx.user.id);
    }),

    /**
     * Admin: Get access logs for a specific license
     */
    getAccessLogs: protectedProcedure
      .input((val: unknown) => {
        if (typeof val !== "object" || val === null) throw new Error("Invalid input");
        const obj = val as Record<string, unknown>;
        if (typeof obj.licenseId !== "number") throw new Error("licenseId must be a number");
        return { licenseId: obj.licenseId };
      })
      .query(async ({ input }) => {
        return await db.getAccessLogs(input.licenseId);
      }),

    /**
     * Admin: Get dashboard statistics
     */
    getStats: protectedProcedure.query(async ({ ctx }) => {
      return await db.getLicenseStats(ctx.user.id);
    }),

    /**
     * Admin: Create new license keys
     */
    create: createLicenseProcedure,

    /**
     * Admin: Revoke a license
     */
    revoke: revokeLicenseProcedure,

    /**
     * Admin: Delete a license
     */
    delete: deleteLicenseProcedure,
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
