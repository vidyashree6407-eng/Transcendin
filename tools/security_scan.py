#!/usr/bin/env python3
"""
Simple repository security scanner (searches for high-risk patterns).

Usage:
    python tools/security_scan.py

This script performs a lightweight grep for common secret names and risky JS patterns.
It is intended to help automate the checks performed in this audit.
"""
import re
import os
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

PATTERNS = {
    'possible_secret': re.compile(r"(?:api[_-]?key|secret|token|passwd|password|client[_-]?secret|aws[_-]?secret|github[_-]?token)", re.I),
    'private_key': re.compile(r"-----BEGIN (?:RSA|PRIVATE|OPENSSH) PRIVATE KEY-----"),
    'eval_like': re.compile(r"\beval\(|\batob\(|fromCharCode|document\.write|innerHTML|insertAdjacentHTML"),
    'http_resource': re.compile(r'http://[^"\']+', re.I),
}

EXCLUDE_DIRS = {'.git', 'node_modules', '.venv', '__pycache__'}


def scan_file(path):
    try:
        text = open(path, 'r', encoding='utf-8', errors='ignore').read()
    except Exception:
        return []
    findings = []
    for name, pat in PATTERNS.items():
        for m in pat.finditer(text):
            # capture snippet
            start = max(0, m.start() - 40)
            end = min(len(text), m.end() + 40)
            snippet = text[start:end].replace('\n', ' ')
            findings.append((name, m.group(0), snippet))
    return findings


def walk_and_scan(root):
    results = {}
    for dirpath, dirnames, filenames in os.walk(root):
        # filter out excluded dirs
        dirnames[:] = [d for d in dirnames if d not in EXCLUDE_DIRS]
        for f in filenames:
            if not f.lower().endswith(('.js', '.py', '.html', '.json', '.env', '.md', '.txt', '.csv')):
                continue
            fp = os.path.join(dirpath, f)
            rel = os.path.relpath(fp, root)
            findings = scan_file(fp)
            if findings:
                results[rel] = findings
    return results


def main():
    print('Scanning', ROOT)
    results = walk_and_scan(ROOT)
    if not results:
        print('No suspicious patterns found by quick scan.')
        return 0
    print('\nFindings:')
    for path, items in sorted(results.items()):
        print(f'- {path}:')
        for kind, match, snippet in items:
            print(f'    [{kind}] "{match}" -> ...{snippet}...')
    return 1


if __name__ == '__main__':
    sys.exit(main())
