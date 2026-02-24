import { z, type ZodType } from "zod";
import { captureError } from "../../utils/telemetry";

export function parseWithSchema<T>(
  schema: ZodType<T>,
  payload: unknown,
  context: string,
  fallback: T
): T {
  const result = schema.safeParse(payload);
  if (result.success) {
    return result.data;
  }

  captureError(result.error, {
    scope: "api-schema-validation",
    context,
  });
  return fallback;
}

export { z };
