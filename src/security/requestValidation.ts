/**
 * Request validation helpers.
 * Provides lightweight schema validation for API route bodies and query params
 * without adding heavy runtime dependencies.
 */

import type { NextApiRequest, NextApiResponse } from 'next';

export type FieldType = 'string' | 'number' | 'boolean' | 'email' | 'address';

export interface FieldRule {
  type: FieldType;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
}

export type Schema = Record<string, FieldRule>;

function validateEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validateAddress(value: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(value);
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export function validateSchema(
  data: Record<string, unknown>,
  schema: Schema,
): ValidationResult {
  const errors: Record<string, string> = {};

  for (const [field, rule] of Object.entries(schema)) {
    const value = data[field];

    if (rule.required && (value === undefined || value === null || value === '')) {
      errors[field] = `${field} is required`;
      continue;
    }
    if (value === undefined || value === null) continue;

    switch (rule.type) {
      case 'string':
        if (typeof value !== 'string') { errors[field] = `${field} must be a string`; break; }
        if (rule.minLength !== undefined && value.length < rule.minLength)
          errors[field] = `${field} must be at least ${rule.minLength} characters`;
        if (rule.maxLength !== undefined && value.length > rule.maxLength)
          errors[field] = `${field} must be at most ${rule.maxLength} characters`;
        if (rule.pattern && !rule.pattern.test(value))
          errors[field] = `${field} has an invalid format`;
        break;
      case 'number': {
        const n = Number(value);
        if (Number.isNaN(n) || !Number.isFinite(n)) { errors[field] = `${field} must be a finite number`; break; }
        if (rule.min !== undefined && n < rule.min)
          errors[field] = `${field} must be >= ${rule.min}`;
        if (rule.max !== undefined && n > rule.max)
          errors[field] = `${field} must be <= ${rule.max}`;
        break;
      }
      case 'boolean':
        if (typeof value !== 'boolean')
          errors[field] = `${field} must be a boolean`;
        break;
      case 'email':
        if (typeof value !== 'string') { errors[field] = `${field} must be a string`; break; }
        if (!validateEmail(value))
          errors[field] = `${field} must be a valid email address`;
        break;
      case 'address':
        if (typeof value !== 'string') { errors[field] = `${field} must be a string`; break; }
        if (!validateAddress(value))
          errors[field] = `${field} must be a valid Ethereum address`;
        break;
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

/**
 * Middleware that validates the request body against a schema.
 * Returns false (and sends a 400 response) if validation fails.
 */
export function validateBody(schema: Schema) {
  return function applyValidation(
    req: NextApiRequest,
    res: NextApiResponse,
  ): boolean {
    const result = validateSchema(
      (req.body ?? {}) as Record<string, unknown>,
      schema,
    );
    if (!result.valid) {
      res.status(400).json({ error: 'Validation failed', details: result.errors });
      return false;
    }
    return true;
  };
}
