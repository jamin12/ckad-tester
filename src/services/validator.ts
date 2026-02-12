import type { ExpectedAnswer } from '../types/question.ts';

import { parseCommand } from './commandParser.ts';
import { matchesYamlRequirements, parseYaml } from './yamlValidator.ts';

export interface ValidationResult {
  score: number;
  isPerfect: boolean;
  isCorrect: boolean;
  matchedAnswer: string;
  feedback: string;
}

// Module-level compiled RegExp
const YAML_INDICATOR_RE = /(?:^|\n)\s*(?:apiVersion:|kind:)/;

// Parse result cache
const validationCache = new Map<string, ValidationResult>();

function isYamlInput(input: string): boolean {
  return YAML_INDICATOR_RE.test(input);
}

function scoreCommandMatch(
  input: string,
  requiredParts: string[],
): number {
  if (requiredParts.length === 0) return 0;

  const parsed = parseCommand(input);

  // Build a searchable set from parsed command parts (all lowercase)
  const searchParts = new Set<string>();

  // Add verb
  if (parsed.verb) searchParts.add(parsed.verb.toLowerCase());

  // Add resource
  if (parsed.resource) searchParts.add(parsed.resource.toLowerCase());

  // Add name
  if (parsed.name) searchParts.add(parsed.name.toLowerCase());

  // Add all raw parts (lowercase)
  for (const part of parsed.rawParts) {
    searchParts.add(part.toLowerCase());
  }

  // Add flags as --key=value and --key
  for (const [key, value] of parsed.flags) {
    searchParts.add(`--${key.toLowerCase()}`);
    searchParts.add(`--${key.toLowerCase()}=${value.toLowerCase()}`);
    searchParts.add(`-${key.toLowerCase()}`);
    searchParts.add(value.toLowerCase());
  }

  // Also build the full normalized input for substring matching
  const fullInput = input.toLowerCase().replace(/\s+/g, ' ').trim();

  let matched = 0;

  for (const required of requiredParts) {
    const lower = required.toLowerCase();

    // Direct set lookup (O(1))
    if (searchParts.has(lower)) {
      matched++;
      continue;
    }

    // Substring match in full input for compound expressions
    if (fullInput.includes(lower)) {
      matched++;
      continue;
    }

    // Check if the required part is a resource alias that matches after normalization
    // e.g., required "pod" should match if user typed "po"
    if (parsed.resource && parsed.resource.toLowerCase() === lower) {
      matched++;
      continue;
    }
  }

  return matched / requiredParts.length;
}

function scoreYamlMatch(
  input: string,
  answer: ExpectedAnswer,
): number {
  if (!answer.yamlRequirements || answer.yamlRequirements.length === 0) return 0;

  const { isValid, parsed } = parseYaml(input);
  if (!isValid || !parsed) return 0;

  const result = matchesYamlRequirements(parsed, answer.yamlRequirements);
  return result.score;
}

function generateFeedback(score: number, isPerfect: boolean, isCorrect: boolean, matchedDescription: string): string {
  if (isPerfect) {
    return `완벽합니다! ${matchedDescription}`;
  }
  if (isCorrect) {
    return `좋습니다! 대부분 맞았습니다. ${matchedDescription}`;
  }
  if (score >= 0.5) {
    return `부분적으로 맞았습니다. 일부 요소가 누락되었습니다.`;
  }
  if (score > 0) {
    return `기본 방향은 맞지만, 더 많은 요소가 필요합니다.`;
  }
  return '답변이 예상과 다릅니다. 힌트를 확인해보세요.';
}

export function validateAnswer(
  input: string,
  expectedAnswers: ExpectedAnswer[],
): ValidationResult {
  const trimmed = input.trim();

  // Check cache
  const cacheKey = trimmed + '::' + expectedAnswers.map((a) => a.description).join('|');
  const cached = validationCache.get(cacheKey);
  if (cached) return cached;

  // Early exit for empty input
  if (!trimmed) {
    const emptyResult: ValidationResult = {
      score: 0,
      isPerfect: false,
      isCorrect: false,
      matchedAnswer: '',
      feedback: '답변을 입력해주세요.',
    };
    return emptyResult;
  }

  const isYaml = isYamlInput(trimmed);

  let bestScore = 0;
  let bestDescription = '';

  for (const answer of expectedAnswers) {
    let score = 0;

    if (isYaml && answer.type === 'yaml') {
      score = scoreYamlMatch(trimmed, answer);
    } else if (!isYaml && answer.type === 'command') {
      score = scoreCommandMatch(trimmed, answer.requiredParts ?? []);
    } else if (isYaml && answer.type === 'command') {
      // User provided YAML but expected command -- try command scoring anyway
      score = scoreCommandMatch(trimmed, answer.requiredParts ?? []) * 0.5;
    } else if (!isYaml && answer.type === 'yaml') {
      // User provided command but expected YAML -- try yaml scoring anyway
      score = scoreYamlMatch(trimmed, answer) * 0.5;
    }

    if (score > bestScore) {
      bestScore = score;
      bestDescription = answer.description;
    }
  }

  const isPerfect = bestScore >= 0.9;
  const isCorrect = bestScore >= 0.7;

  const result: ValidationResult = {
    score: bestScore,
    isPerfect,
    isCorrect,
    matchedAnswer: bestDescription,
    feedback: generateFeedback(bestScore, isPerfect, isCorrect, bestDescription),
  };

  // Cache with size limit
  if (validationCache.size > 500) {
    const firstKey = validationCache.keys().next().value;
    if (firstKey !== undefined) {
      validationCache.delete(firstKey);
    }
  }
  validationCache.set(cacheKey, result);

  return result;
}
