import type { Category, Difficulty } from './common.ts';
import type { VerificationCheck } from './lab.ts';

export interface YamlRequirement {
  path: string;
  value: unknown;
  optional?: boolean;
}

export interface ExpectedAnswer {
  type: 'command' | 'yaml';
  requiredParts?: string[];
  yamlRequirements?: YamlRequirement[];
  description: string;
}

export interface Hint {
  text: string;
  penalty: number;
}

export interface Question {
  id: string;
  category: Category;
  difficulty: Difficulty;
  title: string;
  scenario: string;
  expectedAnswers: ExpectedAnswer[];
  hints: Hint[];
  labVerification?: VerificationCheck[];
}
