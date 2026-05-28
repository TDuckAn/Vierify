import { getTenantOrgId } from "../../context";
import { merchantProcedure, readProcedure, router } from "../../trpc";
import { getGenealogySchema, linkGenealogySchema } from "./genealogy.schema";
import { getGenealogy, linkGenealogy } from "./genealogy.service";

export const genealogyRouter = router({
  get: readProcedure
    .input(getGenealogySchema)
    .query(({ ctx, input }) => getGenealogy(input.batchId, getTenantOrgId(ctx.user))),
  link: merchantProcedure
    .input(linkGenealogySchema)
    .mutation(({ ctx, input }) => linkGenealogy(input, ctx.user.id, getTenantOrgId(ctx.user)))
});
