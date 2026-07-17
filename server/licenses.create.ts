import { protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { z } from "zod";
import { nanoid } from "nanoid";

/**
 * Generate a random license key in format PREFIX-XXXX-XXXX
 */
function generateLicenseKey(prefix: string): string {
  const part1 = nanoid(4).toUpperCase();
  const part2 = nanoid(4).toUpperCase();
  return `${prefix}-${part1}-${part2}`;
}

/**
 * Create license procedure
 */
export const createLicenseProcedure = protectedProcedure
  .input(
    z.object({
      prefix: z.string().min(1).max(20).default("SHADOW"),
      quantity: z.number().min(1).max(100).default(1),
      expiresInDays: z.number().min(0).optional(),
      product: z.enum(["shadow_optimizer", "shadow_1071"]).default("shadow_optimizer"),
    })
  )
  .mutation(async ({ input, ctx }) => {
    const { prefix, quantity, expiresInDays, product } = input;

    try {
      const createdKeys: string[] = [];

      for (let i = 0; i < quantity; i++) {
        const key = generateLicenseKey(prefix);

        // Calculate expiration date if specified
        // expiresInDays = 0 means lifetime (no expiration)
        let expiresAt: Date | null = null;
        if (expiresInDays !== undefined && expiresInDays > 0) {
          expiresAt = new Date();
          // Use exact millisecond calculation for precision (minutes, hours, etc.)
          const msToAdd = Math.round(expiresInDays * 24 * 60 * 60 * 1000);
          expiresAt.setTime(expiresAt.getTime() + msToAdd);
        }

        // Create license in database
        await db.createLicense({
          key,
          status: "active",
          expiresAt,
          product,
          createdByUserId: ctx.user!.id,
        });

        createdKeys.push(key);
      }

      const expiryLabel = (expiresInDays === undefined || expiresInDays === 0)
        ? "Vitalício"
        : `${expiresInDays} dia(s)`;

      return {
        success: true,
        message: `${quantity} chave(s) criada(s) com sucesso! Validade: ${expiryLabel}`,
        keys: createdKeys,
      };
    } catch (error: any) {
      console.error("[License Creation Error]", error);
      // Surface a more helpful error message
      const detail = error?.message || "";
      if (detail.includes("product") || detail.includes("column")) {
        throw new Error(
          "Erro de banco de dados: a coluna 'product' não existe na tabela licenses. " +
          "Reinicie o servidor para aplicar a migração automaticamente."
        );
      }
      throw new Error("Falha ao criar chaves de licença: " + detail);
    }
  });

/**
 * Revoke license procedure
 */
export const revokeLicenseProcedure = protectedProcedure
  .input(
    z.object({
      licenseId: z.number(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    try {
      // Verify ownership
      const licenses = await db.getLicensesByUser(ctx.user!.id);
      const license = licenses.find((l) => l.id === input.licenseId);

      if (!license) {
        throw new Error("License not found or not owned by you");
      }

      // Revoke license
      await db.updateLicenseStatus(input.licenseId, "revoked");

      return {
        success: true,
        message: "License revoked successfully",
      };
    } catch (error) {
      console.error("[License Revocation Error]", error);
      throw new Error("Failed to revoke license");
    }
  });

/**
 * Delete license procedure
 */
export const deleteLicenseProcedure = protectedProcedure
  .input(
    z.object({
      licenseId: z.number(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    try {
      // Verify ownership
      const licenses = await db.getLicensesByUser(ctx.user!.id);
      const license = licenses.find((l) => l.id === input.licenseId);

      if (!license) {
        throw new Error("License not found or not owned by you");
      }

      // For now, we'll just revoke instead of deleting
      // This preserves audit trail
      await db.updateLicenseStatus(input.licenseId, "revoked");

      return {
        success: true,
        message: "License deleted successfully",
      };
    } catch (error) {
      console.error("[License Deletion Error]", error);
      throw new Error("Failed to delete license");
    }
  });
