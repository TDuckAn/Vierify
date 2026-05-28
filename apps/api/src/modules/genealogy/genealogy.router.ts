import { merchantProcedure, readProcedure, router } from "../../trpc";
import { getGenealogySchema, linkGenealogySchema } from "./genealogy.schema";
import { getGenealogy, linkGenealogy } from "./genealogy.service";

export const genealogyRouter = router({
  get: readProcedure
    .input(getGenealogySchema)
    .query(({ input }) => getGenealogy(input.batchId)),
  link: merchantProcedure
    .input(linkGenealogySchema)
    .mutation(({ ctx, input }) => linkGenealogy(input, ctx.user.id))
});
