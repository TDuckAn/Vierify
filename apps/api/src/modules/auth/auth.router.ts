import { protectedProcedure, router } from "../../trpc";

export const authRouter = router({
  me: protectedProcedure.query(({ ctx }) => ({
    email: ctx.user.email,
    id: ctx.user.id
  }))
});
