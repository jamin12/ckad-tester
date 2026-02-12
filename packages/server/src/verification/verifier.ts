import type { Exec } from '@kubernetes/client-node';
import type { VerificationCheck, CheckResult, VerificationResponse } from '@ckad-tester/shared/lab';
import { execCommand } from './execCommand.js';
import { SERVER_CONFIG } from '../config.js';

const WORKSPACE_POD = `${SERVER_CONFIG.workspacePodPrefix}-session`;

export async function runVerification(
  exec: Exec,
  namespace: string,
  questionId: string,
  checks: VerificationCheck[],
): Promise<VerificationResponse> {
  const results: CheckResult[] = [];

  for (const check of checks) {
    try {
      const command = ['sh', '-c', check.command];
      const actual = await execCommand(exec, namespace, WORKSPACE_POD, command);

      const expected = check.expected;
      const passed = matchResult(actual, expected);

      results.push({
        description: check.description,
        passed,
        actual,
        expected,
      });
    } catch (err) {
      results.push({
        description: check.description,
        passed: false,
        actual: `Error: ${String(err)}`,
        expected: check.expected,
      });
    }
  }

  const totalWeight = checks.reduce((sum, c) => sum + (c.weight ?? 1), 0);
  const earnedWeight = checks.reduce((sum, c, i) => {
    const r = results[i];
    return r && r.passed ? sum + (c.weight ?? 1) : sum;
  }, 0);

  const score = totalWeight > 0 ? earnedWeight / totalWeight : 0;
  const passed = score >= 0.7;

  return { questionId, passed, score, checks: results };
}

function matchResult(actual: string, expected: string): boolean {
  // 정규식 패턴인지 확인 (^로 시작하거나 $로 끝나거나 특수문자 포함)
  if (expected.startsWith('^') || expected.endsWith('$') || expected.includes('.*')) {
    try {
      const regex = new RegExp(expected);
      return regex.test(actual);
    } catch {
      // 정규식이 유효하지 않으면 문자열 비교
    }
  }

  return actual === expected;
}
