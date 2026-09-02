import type { RequestHandler } from 'express';
import * as z from 'zod';

type ValidationTarget = 'body' | 'params' | 'query';

export function validate(
  schema: z.ZodType,
  target: ValidationTarget,
): RequestHandler {
  return (req, res, next) => {
    let input: unknown;

    if (target === 'body') {
      input = req.body;
    } else if (target === 'params') {
      input = req.params;
    } else {
      input = req.query;
    }

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

    if (target === 'body') {
      req.body = result.data;
    }

    /*
     * Express 5 exposes req.query using a getter,
     * so keep the parsed query in res.locals.
     */
    if (target === 'query') {
      res.locals.validatedQuery = result.data;
    }

    next();
  };
}
