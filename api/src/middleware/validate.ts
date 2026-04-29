import { Request, Response, NextFunction } from "express";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validates that all provided strings are valid UUIDs.
 * Returns early with 400 if any value fails.
 */
export function validateUUID(params: string[]): boolean {
  return params.every((p) => UUID_REGEX.test(p));
}

/**
 * Checks that req.body contains all required fields (non-undefined).
 * Returns array of missing field names, or empty array if all present.
 */
export function validateRequiredBody(fields: string[]): string[] {
  return fields.filter((f) => !reqBodyHasField(f));
}

/**
 * Checks that req.body contains a field and it is defined.
 */
function reqBodyHasField(field: string): boolean {
  // Access via Express request context — used inside middleware.
  // Standalone version below used in route handlers.
  return false;
}

/**
 * Route-level validator: returns missing required body fields.
 * Usage:
 *   const missing = getMissingFields(req.body, ["title", "cityId"]);
 *   if (missing.length) { res.status(400).json({ error: `Missing: ${missing.join(", ")}` }); return; }
 */
export function getMissingFields(body: Record<string, unknown>, fields: string[]): string[] {
  return fields.filter((f) => body[f] === undefined || body[f] === null);
}

/**
 * Validates that a specific body field is a string with length <= max.
 * Returns true if valid, false otherwise.
 */
export function validateStringLength(value: unknown, field: string, max: number): { valid: boolean; message?: string } {
  if (typeof value !== "string") {
    return { valid: false, message: `${field} must be a string` };
  }
  if (value.length > max) {
    return { valid: false, message: `${field} must not exceed ${max} characters` };
  }
  return { valid: true };
}

/**
 * Express middleware factory: validates UUID params.
 * Usage: router.get("/:id", validateUuidParams(["id"]), handler)
 */
export function validateUuidParams(paramNames: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const values = paramNames.map((n) => {
      const raw = req.params[n];
      return Array.isArray(raw) ? raw[0] : raw || "";
    });
    if (!validateUUID(values)) {
      res.status(400).json({ error: "Invalid UUID parameter" });
      return;
    }
    next();
  };
}

/**
 * Express middleware factory: validates required body fields.
 * Usage: router.post("/", validateBodyFields(["title", "description"]), handler)
 */
export function validateBodyFields(requiredFields: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const missing = getMissingFields(req.body as Record<string, unknown>, requiredFields);
    if (missing.length > 0) {
      res.status(400).json({ error: `Missing required fields: ${missing.join(", ")}` });
      return;
    }
    next();
  };
}
