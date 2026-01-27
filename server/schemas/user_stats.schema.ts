import z from "zod";

<<<<<<< HEAD
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
=======
export const getOverviewStatsSchema = z.object({
    month:z.string().min(1).transform((val)=> Number(val)).optional(),
    year:z.string().min(4).transform((val)=> Number(val)).optional(),
})
>>>>>>> d2383351ed7802c64f13adccbbb3b61a799e9ea6
