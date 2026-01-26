import z from "zod";

export const getOverviewStatsSchema = z.object({
    month:z.string().min(1).transform((val)=> Number(val)).optional(),
    year:z.string().min(4).transform((val)=> Number(val)).optional(),
})