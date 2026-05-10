#!/usr/bin/env python3
"""
Scan markdown files under docs/ and replace frontmatter date values equal to
"待补充" with the git creation date (ISO YYYY-MM-DD). If creation date is
not available, fall back to the most recent commit date for the file.

Usage:
  python scripts/update_frontmatter_dates.py
"""
from pathlib import Path
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / 'docs'

FRONTMATTER_RE = re.compile(r"^---\n(.*?)\n---\n", re.S)
DATE_LINE_RE = re.compile(r"^date:\s*(.+)$", re.M)


def git_date_for(path: Path):
    # try creation date (first commit that added the file)
    try:
        cmd = ['git', 'log', '--diff-filter=A', '--follow', '--format=%aI', '-1', '--', str(path)]
        res = subprocess.run(cmd, capture_output=True, text=True, cwd=ROOT)
        out = res.stdout.strip()
        if out:
            return out.splitlines()[0]
    except Exception:
        pass
    # fallback to last commit date
    try:
        cmd = ['git', 'log', '--format=%aI', '-1', '--', str(path)]
        res = subprocess.run(cmd, capture_output=True, text=True, cwd=ROOT)
        out = res.stdout.strip()
        if out:
            return out.splitlines()[0]
    except Exception:
        pass
    return ''


def process_file(md_path: Path):
    text = md_path.read_text(encoding='utf-8')
    m = FRONTMATTER_RE.match(text)
    if not m:
        return False
    fm = m.group(1)
    date_m = DATE_LINE_RE.search(fm)
    if not date_m:
        return False
    date_val = date_m.group(1).strip().strip('"').strip("'")
    if date_val != '待补充':
        return False
    git_dt = git_date_for(md_path.relative_to(ROOT))
    if not git_dt:
        print('WARN: no git date for', md_path)
        return False
    iso = git_dt.split('T')[0]
    new_fm = DATE_LINE_RE.sub(f'date: {iso}', fm, count=1)
    new_text = text[:m.start(1)] + new_fm + text[m.end(1):]
    md_path.write_text(new_text, encoding='utf-8')
    print('Updated', md_path, '=>', iso)
    return True


def main():
    if not DOCS.exists():
        print('docs/ not found', DOCS)
        sys.exit(1)
    updated = 0
    for md in DOCS.rglob('*.md'):
        try:
            if process_file(md):
                updated += 1
        except Exception as e:
            print('ERR', md, e)
    print('Done. Updated', updated, 'files.')


if __name__ == '__main__':
    main()
