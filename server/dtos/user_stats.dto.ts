import z from "zod";
import { getOverviewStatsSchema } from "../schemas";

export type GetOverviewStatsDTO = z.infer<typeof getOverviewStatsSchema>;