import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const excludedFiles = new Set(['.env.example']);
const binaryExtensions = new Set([
  '.gif',
  '.ico',
  '.jpeg',
  '.jpg',
  '.pdf',
  '.png',
  '.webp',
]);
const trackedFiles = execFileSync(
  'git',
  ['ls-files', '-z', '--cached', '--others', '--exclude-standard'],
  { encoding: 'utf8' },
)
  .split('\0')
  .filter(Boolean);

const violations = [];

const rules = [
  {
    label: 'private key',
    pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  },
  {
    label: 'GitHub token',
    pattern:
      /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{20,}\b|\bgithub_pat_[A-Za-z0-9_]{20,}\b/,
  },
  {
    label: 'Slack token',
    pattern: /\bxox(?:b|p|a|r|s)-[A-Za-z0-9-]{10,}\b/,
  },
  {
    label: 'OpenAI API key',
    pattern: /\bsk-[A-Za-z0-9_-]{20,}\b/,
  },
  {
    label: 'secret-looking Vite environment variable',
    pattern:
      /\bVITE_[A-Z0-9_]*(?:SECRET|TOKEN|PASSWORD|PRIVATE_KEY)[A-Z0-9_]*\b/,
  },
];

for (const file of trackedFiles) {
  if (excludedFiles.has(file)) continue;
  const extension = file.slice(file.lastIndexOf('.')).toLowerCase();
  if (binaryExtensions.has(extension)) continue;

  if (file === '.env' || file.startsWith('.env.')) {
    violations.push(`${file}: environment files must not be tracked`);
    continue;
  }

  let content;
  try {
    content = readFileSync(file, 'utf8');
  } catch {
    continue;
  }

  for (const rule of rules) {
    if (rule.pattern.test(content))
      violations.push(`${file}: possible ${rule.label}`);
  }
}

if (violations.length > 0) {
  console.error('Public-secret check failed:');
  for (const violation of violations) console.error(`- ${violation}`);
  process.exitCode = 1;
} else {
  console.log('Public-secret check passed.');
}
