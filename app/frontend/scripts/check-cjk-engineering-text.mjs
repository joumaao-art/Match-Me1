#!/usr/bin/env node
/**
 * Engineering language check — accidental Han ideographs.
 * ============================================================
 * MatchMe's engineering language is English (see
 * `docs/enterprise/EngineeringLanguagePolicy.md`), while the product ships in
 * English and Arabic. This script finds accidental non-English (Han) text in
 * engineering-controlled files so it can be translated into English instead of
 * being silently committed.
 *
 * Design constraints that follow directly from the policy:
 *   - It looks ONLY for Han ideographs. Arabic — indeed every other script — is
 *     never flagged, so the check can never be used to strip legitimate
 *     localization content.
 *   - Approved reference data (locale native display names, language seed
 *     rows) is listed explicitly below with a reason, so genuine findings
 *     cannot be silenced by loosening the pattern.
 *   - It reports FILE, LINE and TEXT, and never edits anything.
 *
 * Usage:
 *   node scripts/check-cjk-engineering-text.mjs
 *   pnpm run check:language
 *
 * Environment:
 *   LANGUAGE_CHECK_ROOTS - comma-separated roots to scan (defaults below)
 *   LANGUAGE_CHECK_JSON  - "1" to print machine-readable JSON only
 */
import fs from 'node:fs';
import path from 'node:path';

// Han ideographs only. Arabic, Latin, Cyrillic, and every other script pass.
const HAN = /\p{Script=Han}/u;

/** Directories never scanned: dependencies, build output, and VCS metadata. */
const EXCLUDED_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  'out',
  'coverage',
  '.vite',
  '.turbo',
  '.next',
  '.cache',
  'vendor',
  '__snapshots__',
]);

/** Text files worth scanning. Binary and lock files are skipped. */
const SCANNED_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
  '.json', '.md', '.mdx', '.yml', '.yaml',
  '.html', '.css', '.scss', '.sql', '.txt', '.sh',
]);

/**
 * Files approved to contain non-English reference data, as a whole file.
 * Each entry needs a written reason; the reason is what makes the approval
 * reviewable, and adding one is a deliberate code-review decision.
 */
const APPROVED_FILES = [
  {
    // A language is listed in the registry by its own native name, exactly like
    // French, Spanish, Urdu, or Hindi. Reference data, not engineering prose.
    path: 'src/lib/i18n.ts',
    reason: 'supportedLanguages registry lists each locale by its native display name',
  },
  {
    // Product data written into the database at seed time.
    path: 'supabase/migrations/009_production_realtime_seeds.sql',
    reason: 'language reference table is seeded with native display names',
  },
];

/** Inline marker that approves a single line, always requiring a reason. */
const INLINE_ALLOW = /cjk-allow\s*[:\-]\s*\S+/;

const DEFAULT_ROOTS = ['.', 'packages', 'supabase', 'docs', 'scripts'];

const toPosix = (value) => value.split(path.sep).join('/');

const isApprovedFile = (relativePath) =>
  APPROVED_FILES.some((entry) => relativePath === entry.path || relativePath.endsWith(`/${entry.path}`));

/** Recursively collect scannable files under a root. */
function collectFiles(root, repoRoot, collected) {
  if (!fs.existsSync(root)) return;
  const stats = fs.statSync(root);
  if (stats.isFile()) {
    const ext = path.extname(root).toLowerCase();
    if (SCANNED_EXTENSIONS.has(ext)) collected.push(root);
    return;
  }
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (EXCLUDED_DIRS.has(entry.name)) continue;
      collectFiles(path.join(root, entry.name), repoRoot, collected);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (!SCANNED_EXTENSIONS.has(ext)) continue;
      if (entry.name.includes('.min.')) continue;
      if (entry.name.endsWith('pnpm-lock.yaml') || entry.name.endsWith('package-lock.json')) continue;
      collected.push(path.join(root, entry.name));
    }
  }
}

const main = () => {
  const repoRoot = process.cwd();
  const roots = (process.env.LANGUAGE_CHECK_ROOTS || DEFAULT_ROOTS.join(','))
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => path.resolve(repoRoot, value));

  const collected = [];
  for (const root of roots) collectFiles(root, repoRoot, collected);
  // Roots may overlap (for example "." and "supabase"); dedupe so each file is
  // inspected exactly once and each occurrence is reported exactly once.
  const files = [...new Set(collected)];

  const findings = [];
  const approvedHits = [];
  let scannedFiles = 0;
  let scannedLines = 0;

  for (const file of files) {
    const relative = toPosix(path.relative(repoRoot, file));
    let content;
    try {
      content = fs.readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    if (!HAN.test(content)) continue;
    scannedFiles += 1;

    const lines = content.split(/\r?\n/);
    scannedLines += lines.length;
    const approvedFile = isApprovedFile(relative);

    lines.forEach((line, index) => {
      if (!HAN.test(line)) return;
      const text = line.trim().slice(0, 200);
      const record = { file: relative, line: index + 1, text };
      if (approvedFile) {
        record.reason = APPROVED_FILES.find(
          (entry) => relative === entry.path || relative.endsWith(`/${entry.path}`)
        ).reason;
        approvedHits.push(record);
      } else if (INLINE_ALLOW.test(line)) {
        record.reason = 'inline cjk-allow marker';
        approvedHits.push(record);
      } else {
        findings.push(record);
      }
    });
  }

  const report = {
    scannedRoots: roots.map((root) => toPosix(path.relative(repoRoot, root)) || '.'),
    scannedFileCount: files.length,
    filesContainingHan: scannedFiles,
    linesInspected: scannedLines,
    unexpectedFindings: findings,
    approvedOccurrences: approvedHits,
    passed: findings.length === 0,
  };

  if (process.env.LANGUAGE_CHECK_JSON === '1') {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log('Engineering language check (Han ideographs)');
    console.log(`Roots        : ${report.scannedRoots.join(', ')}`);
    console.log(`Files scanned: ${report.scannedFileCount} (${report.linesInspected} lines inspected)`);
    console.log('');

    if (approvedHits.length) {
      console.log(`APPROVED non-English reference data (${approvedHits.length})`);
      for (const hit of approvedHits) {
        console.log(`  ${hit.file}:${hit.line}  ${hit.text}`);
        console.log(`      reason: ${hit.reason}`);
      }
      console.log('');
    }

    if (findings.length) {
      console.log(`UNEXPECTED engineering text (${findings.length}) — translate into English`);
      for (const item of findings) {
        console.log(`  FILE: ${item.file}`);
        console.log(`  LINE: ${item.line}`);
        console.log(`  TEXT: ${item.text}`);
        console.log('');
      }
      console.log('Language check FAILED.');
    } else {
      console.log('No accidental non-English engineering text found. Language check PASSED.');
    }
    console.log('');
    console.log('Note: Arabic and all other non-Han scripts are intentionally never flagged.');
  }

  if (!report.passed) process.exitCode = 1;
};

main();
