import type { RequestHandler } from 'express';
import * as z from 'zod';

type ValidationTarget = 'body' | 'params';

export function validate(
  schema: z.ZodType,
  target: ValidationTarget,
): RequestHandler {
  return (req, res, next) => {
    const input = target === 'body' ? req.body : req.params;

    const result = schema.safeParse(input);

    if (!result.success) {
      res.status(400).json({
        message: 'Request validation failed',

        errors: result.error.issues.map((issue) => ({
          path: issue.path.map(String).join('.'),
          message: issue.message,
        })),
      });

      return;
    }

    /*
     * Use Zod's parsed output so trimmed values
     * and defaults reach the controller.
     */
    if (target === 'body') {
      req.body = result.data;
    }

    next();
  };
}
