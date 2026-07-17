import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as bcrypt from "bcryptjs";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import { sdk } from "./_core/sdk";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { ENV } from "./_core/env";

export const authRouter = router({
  login: publicProcedure
    .input(z.object({
      username: z.string(),
      password: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await db.getUserByUsername(input.username);

      if (!user || !user.passwordHash) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Credenciais inválidas",
        });
      }

      const passwordMatch = await bcrypt.compare(input.password, user.passwordHash);

      if (!passwordMatch) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Credenciais inválidas",
        });
      }

      // Create session token
      const sessionToken = await sdk.createSessionToken(user.openId || user.id.toString(), { 
        name: user.name || user.username || user.openId || ""
      });

      // Set cookie
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        expires: new Date(Date.now() + ONE_YEAR_MS),
      });

      return { success: true };
    }),

  me: publicProcedure.query(opts => opts.ctx.user),
  
  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return {
      success: true,
    } as const;
  }),
});
