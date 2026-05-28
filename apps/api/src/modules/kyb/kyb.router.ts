import { adminProcedure, router } from "../../trpc";
import { verifyKybTaxCodeSchema } from "./kyb.schema";
import { verifyKybTaxCode } from "./kyb.service";

export const kybRouter = router({
  verifyTaxCode: adminProcedure
    .input(verifyKybTaxCodeSchema)
    .mutation(({ ctx, input }) => verifyKybTaxCode(input, ctx.user.id))
});
