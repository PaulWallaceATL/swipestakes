import { z } from "zod";
import { getGameDayTimezone, getGamePickDate } from "./gameDay";
import { notifyOwner } from "./notification";
import { adminProcedure, publicProcedure, router } from "./trpc";

export const systemRouter = router({
  /**
   * Public clock for PICK5 calendar day — clients should not infer "today" locally only.
   * Same value for web, iOS, and Android when they call your API.
   */
  gameClock: publicProcedure.query(() => {
    return {
      pickDate: getGamePickDate(),
      timezone: getGameDayTimezone(),
    } as const;
  }),

  health: publicProcedure
    .input(
      z.object({
        timestamp: z.number().min(0, "timestamp cannot be negative"),
      })
    )
    .query(() => ({
      ok: true,
    })),

  notifyOwner: adminProcedure
    .input(
      z.object({
        title: z.string().min(1, "title is required"),
        content: z.string().min(1, "content is required"),
      })
    )
    .mutation(async ({ input }) => {
      const delivered = await notifyOwner(input);
      return {
        success: delivered,
      } as const;
    }),
});
