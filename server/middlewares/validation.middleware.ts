import { z, ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { StatusCodes } from "http-status-codes";
import { Request, Response, NextFunction } from "express";

export const validateAll = ({
  body,
  params,
  query,
}: {
  body?: z.ZodType;
  params?: z.ZodType;
  query?: z.ZodType;
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      body && body.parse(req.body);
      params && params.parse(req.params);
      query && query.parse(req.query);

      return next();
    } catch (err) {
      // Nếu lỗi từ Zod → format đẹp
      if (err instanceof ZodError) {
        const formatted = fromZodError(err, { prefix: null });
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: formatted.message,
        });
      }

      // Còn lại → throw lỗi bình thường
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "Invalid request data",
      });
    }
  };
};
