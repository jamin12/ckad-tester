import { parse } from 'yaml';

import type { YamlRequirement } from '../types/question.ts';

export interface YamlValidationResult {
  isValid: boolean;
  parsed: Record<string, unknown> | null;
  error: string | null;
}

// Module-level compiled RegExp for array index notation
const ARRAY_INDEX_RE = /^([^[]+)\[(\d+)\]$/;

export function parseYaml(input: string): YamlValidationResult {
  try {
    const parsed = parse(input) as Record<string, unknown>;
    if (parsed === null || parsed === undefined || typeof parsed !== 'object') {
      return {
        isValid: false,
        parsed: null,
        error: 'YAML이 유효한 객체로 파싱되지 않았습니다.',
      };
    }
    return { isValid: true, parsed, error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { isValid: false, parsed: null, error: `YAML 파싱 오류: ${message}` };
  }
}

export function getValueAtPath(obj: unknown, path: string): unknown {
  if (obj === null || obj === undefined) return undefined;

  const segments = path.split('.');
  let current: unknown = obj;

  for (const segment of segments) {
    if (current === null || current === undefined) return undefined;

    // Check for array index notation like containers[0]
    const arrayMatch = ARRAY_INDEX_RE.exec(segment);
    if (arrayMatch) {
      const key = arrayMatch[1]!;
      const index = parseInt(arrayMatch[2]!, 10);

      if (typeof current !== 'object') return undefined;
      const intermediate = (current as Record<string, unknown>)[key];
      if (!Array.isArray(intermediate)) return undefined;
      current = intermediate[index];
    } else {
      if (typeof current !== 'object') return undefined;
      current = (current as Record<string, unknown>)[segment];
    }
  }

  return current;
}

export function matchesYamlRequirements(
  parsed: Record<string, unknown>,
  requirements: YamlRequirement[],
): { score: number; matched: string[]; missing: string[] } {
  const matched: string[] = [];
  const missing: string[] = [];
  let requiredCount = 0;

  for (const req of requirements) {
    if (req.optional) {
      // Optional requirements contribute to score but don't penalize if absent
      const actual = getValueAtPath(parsed, req.path);
      if (valuesMatch(actual, req.value)) {
        matched.push(req.path);
      }
      continue;
    }

    requiredCount++;
    const actual = getValueAtPath(parsed, req.path);

    if (valuesMatch(actual, req.value)) {
      matched.push(req.path);
    } else {
      missing.push(req.path);
    }
  }

  const denominator = requiredCount || 1;
  const requiredMatched = matched.filter((path) => {
    const req = requirements.find((r) => r.path === path);
    return req && !req.optional;
  }).length;

  // Optional matches add bonus (up to 10% of remaining score)
  const optionalMatched = matched.length - requiredMatched;
  const optionalTotal = requirements.filter((r) => r.optional).length;
  const baseScore = requiredMatched / denominator;
  const optionalBonus =
    optionalTotal > 0 ? (optionalMatched / optionalTotal) * 0.1 : 0;

  const score = Math.min(1, baseScore + optionalBonus);

  return { score, matched, missing };
}

function valuesMatch(actual: unknown, expected: unknown): boolean {
  // If expected is undefined/null, just check existence
  if (expected === undefined || expected === null) {
    return actual !== undefined && actual !== null;
  }

  // If expected is a string, do case-insensitive comparison
  if (typeof expected === 'string' && typeof actual === 'string') {
    return actual.toLowerCase() === expected.toLowerCase();
  }

  // Numeric comparison
  if (typeof expected === 'number') {
    return Number(actual) === expected;
  }

  // Boolean comparison
  if (typeof expected === 'boolean') {
    return actual === expected;
  }

  // Array: check that all expected items exist in actual
  if (Array.isArray(expected)) {
    if (!Array.isArray(actual)) return false;
    return expected.every((expectedItem) =>
      actual.some((actualItem) => valuesMatch(actualItem, expectedItem)),
    );
  }

  // Object: check that all expected keys match
  if (typeof expected === 'object' && typeof actual === 'object' && actual !== null) {
    const expectedObj = expected as Record<string, unknown>;
    const actualObj = actual as Record<string, unknown>;
    return Object.keys(expectedObj).every((key) =>
      valuesMatch(actualObj[key], expectedObj[key]),
    );
  }

  // Fallback: strict equality
  return actual === expected;
}
