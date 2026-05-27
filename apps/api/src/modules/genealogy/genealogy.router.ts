import { protectedProcedure, router } from "../../trpc";
import { getGenealogySchema, linkGenealogySchema } from "./genealogy.schema";
import { getGenealogy, linkGenealogy } from "./genealogy.service";

export const genealogyRouter = router({
  get: protectedProcedure
    .input(getGenealogySchema)
    .query(({ input }) => getGenealogy(input.batchId)),
  link: protectedProcedure
    .input(linkGenealogySchema)
    .mutation(({ ctx, input }) => linkGenealogy(input, ctx.user.id))
});
