import z from "zod";

const currentYear = new Date().getFullYear();

export const getOverviewStatsSchema = z.object({
  month: z
    .preprocess(
      (val) => (val === undefined ? undefined : Number(val)),
      z.number().min(1, "Tháng phải từ 1-12").max(12, "Tháng phải từ 1-12"),
    )
    .default(new Date().getMonth() + 1)
    .optional(),

  year: z
    .preprocess(
      (val) => (val === undefined ? undefined : Number(val)),
      z
        .number()
        .min(currentYear - 1, `Năm phải từ ${currentYear - 1} trở đi`)
        .max(currentYear, `Năm không được vượt quá ${currentYear}`),
    )
    .default(currentYear)
    .optional(),
});
