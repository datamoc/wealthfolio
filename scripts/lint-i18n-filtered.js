#!/usr/bin/env node

/**
 * Filtered i18n linter - runs i18next-cli lint and filters out false positives
 * Usage: node scripts/lint-i18n-filtered.js
 */

import { execSync } from 'child_process';

// Patterns to ignore (false positives)
const IGNORE_PATTERNS = [
  // Route paths and URLs
  /^[a-z0-9-/:*]+$/,

  // CSS/Style values
  /^\d+%$/,                          // 100%, 5%, etc.
  /^var\(--[\w-]+\)$/,              // CSS variables
  /^\d+\s+\d+$/,                    // spacing values like "5 5", "3 3"
  /^#[0-9a-fA-F]{3,8}$/,           // hex colors
  /^url\(#[\w-]+\)$/,               // SVG urls

  // HTML/ARIA attributes and values
  /^(outline|combobox|listbox|button|dialog|checkbox|radio|menu|menuitem|toolbar|tooltip|alert|status|log|marquee|timer|progressbar|none|polite|assertive|off|mixed|tree|grid|row|cell|columnheader|rowheader)$/, // ARIA roles
  /^(top|bottom|start|end|center|left|right|middle)$/,          // positions
  /^(light|dark|system)$/,          // theme values (technical)
  /^(vertical|horizontal|inline|block)$/,        // orientations
  /^(sm|md|lg|xl|2xl|xs|icon|icon-xs|icon-sm)$/, // size variants
  /^(default|primary|secondary|destructive|ghost|link|outline)$/, // button variants
  /^(ease-in|ease-out|ease-in-out|linear)$/, // animations

  // Form field names and identifiers (camelCase, kebab-case)
  /^[a-z][a-zA-Z0-9]*$/,            // camelCase like "assetId", "accountId"
  /^[a-z][a-z0-9-]*-[a-z0-9-]+$/,   // kebab-case like "icon-xs", "user-menu"

  // Data types and technical constants
  /^(decimal|sign|minute|hour|day|week|month|year|date|time|datetime|form|shares|text|number|email|password|tel|url|file|hidden|submit|reset|image|color|range|search)$/,

  // Single characters and very short technical strings
  /^[a-z]$/,                        // single letters
  /^: \d+$/,                        // ": 1" patterns
  /^\*$/,                           // asterisk (likely glob pattern)

  // Empty or whitespace-only
  /^\s*$/,
];

// Check if a string should be ignored
function shouldIgnore(str) {
  // Remove quotes if present
  const cleaned = str.replace(/^["']|["']$/g, '');

  return IGNORE_PATTERNS.some(pattern => pattern.test(cleaned));
}

// Parse and filter lint output
function filterLintOutput(output) {
  const lines = output.split('\n');
  const issues = [];
  let currentFile = null;

  for (const line of lines) {
    // Check if this is a file path line
    if (line.match(/^[a-zA-Z]:\\/) || line.match(/^src[/\\]/)) {
      currentFile = line.trim();
      continue;
    }

    // Check if this is an error line
    const errorMatch = line.match(/^\s+(\d+):\s+Error:\s+Found hardcoded string:\s+"(.+)"$/);
    if (errorMatch && currentFile) {
      const [, lineNumber, text] = errorMatch;

      if (!shouldIgnore(text)) {
        issues.push({
          file: currentFile,
          line: lineNumber,
          text: text
        });
      }
    }
  }

  return issues;
}

// Format output
function formatIssues(issues) {
  if (issues.length === 0) {
    console.log('✓ No hardcoded user-facing strings found!\n');
    return;
  }

  console.log(`Found ${issues.length} user-facing strings that need translation:\n`);

  // Group by file
  const byFile = {};
  for (const issue of issues) {
    if (!byFile[issue.file]) {
      byFile[issue.file] = [];
    }
    byFile[issue.file].push(issue);
  }

  // Print grouped by file
  for (const [file, fileIssues] of Object.entries(byFile)) {
    console.log(`\n${file}`);
    for (const issue of fileIssues) {
      console.log(`  ${issue.line}: "${issue.text}"`);
    }
  }

  console.log(`\n\nTotal: ${issues.length} strings need translation`);
}

// Main execution
try {
  console.log('Running i18next-cli lint...\n');

  // Run the linter (it will exit with code 1 if issues found, so we ignore errors)
  let output;
  try {
    output = execSync('pnpm i18next-cli lint', {
      encoding: 'utf-8',
      stdio: 'pipe'
    });
  } catch (error) {
    // Linter returns exit code 1 when issues are found, capture the output anyway
    output = error.stdout + error.stderr;
  }

  // Filter and format the output
  const issues = filterLintOutput(output);
  formatIssues(issues);

} catch (error) {
  console.error('Error running linter:', error.message);
  process.exit(1);
}
