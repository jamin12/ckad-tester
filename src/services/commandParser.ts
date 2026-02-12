// Module-level compiled RegExp patterns
const WHITESPACE_RE = /\s+/g;
const FLAG_WITH_EQUALS_RE = /^--?([^=]+)=(.*)$/;
const FLAG_RE = /^--?(.+)$/;
const KUBECTL_PREFIX_RE = /^kubectl\s+/;

// O(1) alias lookup map
const RESOURCE_ALIASES = new Map<string, string>([
  ['po', 'pod'],
  ['pods', 'pod'],
  ['deploy', 'deployment'],
  ['deployments', 'deployment'],
  ['svc', 'service'],
  ['services', 'service'],
  ['rs', 'replicaset'],
  ['replicasets', 'replicaset'],
  ['cm', 'configmap'],
  ['configmaps', 'configmap'],
  ['ns', 'namespace'],
  ['namespaces', 'namespace'],
  ['no', 'node'],
  ['nodes', 'node'],
  ['ing', 'ingress'],
  ['ingresses', 'ingress'],
  ['netpol', 'networkpolicy'],
  ['networkpolicies', 'networkpolicy'],
  ['pvc', 'persistentvolumeclaim'],
  ['persistentvolumeclaims', 'persistentvolumeclaim'],
  ['sa', 'serviceaccount'],
  ['serviceaccounts', 'serviceaccount'],
  ['ds', 'daemonset'],
  ['daemonsets', 'daemonset'],
  ['sts', 'statefulset'],
  ['statefulsets', 'statefulset'],
  ['jobs', 'job'],
  ['cj', 'cronjob'],
  ['cronjobs', 'cronjob'],
  ['pv', 'persistentvolume'],
  ['persistentvolumes', 'persistentvolume'],
  ['ep', 'endpoints'],
  ['quota', 'resourcequota'],
  ['resourcequotas', 'resourcequota'],
  ['limits', 'limitrange'],
  ['limitranges', 'limitrange'],
  ['hpa', 'horizontalpodautoscaler'],
  ['horizontalpodautoscalers', 'horizontalpodautoscaler'],
]);

const VERBS = new Set([
  'run',
  'create',
  'get',
  'describe',
  'delete',
  'expose',
  'set',
  'rollout',
  'apply',
  'edit',
  'scale',
  'label',
  'annotate',
  'exec',
  'logs',
  'port-forward',
  'top',
  'patch',
  'replace',
  'explain',
  'auth',
  'taint',
  'cordon',
  'uncordon',
  'drain',
  'cp',
  'attach',
  'config',
]);

// Parse cache for repeat inputs
const parseCache = new Map<string, ParsedCommand>();

export interface ParsedCommand {
  verb: string;
  resource: string;
  name: string;
  flags: Map<string, string>;
  rawParts: string[];
}

function normalizeResource(resource: string): string {
  const lower = resource.toLowerCase();
  return RESOURCE_ALIASES.get(lower) ?? lower;
}

export function parseCommand(input: string): ParsedCommand {
  const cached = parseCache.get(input);
  if (cached) return cached;

  // Trim and normalize whitespace
  const normalized = input.trim().replace(WHITESPACE_RE, ' ');

  // Remove kubectl prefix if present
  const withoutKubectl = normalized.replace(KUBECTL_PREFIX_RE, '');

  const parts = withoutKubectl.split(' ');
  const rawParts: string[] = [];
  const flags = new Map<string, string>();

  let verb = '';
  let resource = '';
  let name = '';
  let i = 0;

  // Extract verb
  if (i < parts.length) {
    const candidate = parts[i]!.toLowerCase();
    if (VERBS.has(candidate)) {
      verb = candidate;
      rawParts.push(candidate);
      i++;

      // Handle compound verbs like "rollout undo", "rollout status", "rollout history"
      if (verb === 'rollout' && i < parts.length) {
        const subVerb = parts[i]!.toLowerCase();
        if (
          subVerb === 'undo' ||
          subVerb === 'status' ||
          subVerb === 'history' ||
          subVerb === 'restart' ||
          subVerb === 'pause' ||
          subVerb === 'resume'
        ) {
          verb = `rollout ${subVerb}`;
          rawParts.push(subVerb);
          i++;
        }
      }

      // Handle "set" subcommands like "set image", "set env"
      if (verb === 'set' && i < parts.length) {
        const subVerb = parts[i]!.toLowerCase();
        if (
          subVerb === 'image' ||
          subVerb === 'env' ||
          subVerb === 'resources' ||
          subVerb === 'serviceaccount' ||
          subVerb === 'selector' ||
          subVerb === 'subject'
        ) {
          verb = `set ${subVerb}`;
          rawParts.push(subVerb);
          i++;
        }
      }
    } else {
      // Not a recognized verb; treat the whole input as raw parts
      verb = candidate;
      rawParts.push(candidate);
      i++;
    }
  }

  // Parse remaining parts: extract flags, resource, and name
  let resourceFound = false;

  while (i < parts.length) {
    const part = parts[i]!;

    // Check for --flag=value
    const equalsMatch = FLAG_WITH_EQUALS_RE.exec(part);
    if (equalsMatch) {
      flags.set(equalsMatch[1]!, equalsMatch[2]!);
      rawParts.push(part);
      i++;
      continue;
    }

    // Check for --flag or -flag (possibly followed by value)
    const flagMatch = FLAG_RE.exec(part);
    if (flagMatch) {
      const flagName = flagMatch[1]!;
      rawParts.push(part);
      i++;

      // Check if next part is the flag value (not another flag)
      if (i < parts.length && !parts[i]!.startsWith('-')) {
        flags.set(flagName, parts[i]!);
        rawParts.push(parts[i]!);
        i++;
      } else {
        flags.set(flagName, 'true');
      }
      continue;
    }

    // Non-flag part: first is resource type, second is resource name
    rawParts.push(part);
    if (!resourceFound) {
      // Handle resource/name format like "deployment/nginx"
      if (part.includes('/')) {
        const [resourcePart, namePart] = part.split('/');
        resource = normalizeResource(resourcePart!);
        name = namePart ?? '';
      } else {
        resource = normalizeResource(part);
      }
      resourceFound = true;
    } else if (!name) {
      name = part;
    }
    i++;
  }

  const result: ParsedCommand = { verb, resource, name, flags, rawParts };

  // Cache the result (limit cache size to prevent memory leaks)
  if (parseCache.size > 500) {
    const firstKey = parseCache.keys().next().value;
    if (firstKey !== undefined) {
      parseCache.delete(firstKey);
    }
  }
  parseCache.set(input, result);

  return result;
}
