#!/usr/bin/env python3
"""
fill_missing_dates.py

Scan the `docs/` folder for markdown files missing a `date` in their YAML frontmatter
or containing placeholders like "待补充" and fill them using Git history (first commit
date when available, otherwise last commit date).

Usage:
  python scripts/fill_missing_dates.py        # dry-run
  python scripts/fill_missing_dates.py --apply  # apply changes
  python scripts/fill_missing_dates.py --path mydocs --apply
"""

from pathlib import Path
import re
import subprocess
import argparse
import sys


def run_git_date(path: Path):
    # Try to get the date of the first commit that added the file
    try:
        p = subprocess.run([
            'git', 'log', '--diff-filter=A', '--follow', '--format=%aI', '-1', '--', str(path)
        ], capture_output=True, text=True)
        out = p.stdout.strip()
        if out:
            return out.split('T', 1)[0]

        # fallback to last commit date
        p2 = subprocess.run([
            'git', 'log', '-1', '--format=%aI', '--', str(path)
        ], capture_output=True, text=True)
        out2 = p2.stdout.strip()
        if out2:
            return out2.split('T', 1)[0]
    except Exception as e:
        print(f'git error for {path}: {e}')

    return None


def has_date_in_frontmatter(fm: str):
    return re.search(r"^\s*date\s*:\s*.+$", fm, flags=re.M) is not None


def process_file(path: Path, dry_run: bool = True):
    try:
        text = path.read_text(encoding='utf-8')
    except Exception:
        try:
            text = path.read_text(encoding='utf-8', errors='replace')
        except Exception as e:
            print(f'ERROR reading {path}: {e}')
            return False, None

    fm_match = re.match(r'^---\s*\n(.*?\n)---\s*\n?', text, flags=re.S)
    if fm_match:
        fm = fm_match.group(1)
        body = text[fm_match.end():]
        if has_date_in_frontmatter(fm):
            # if date exists but is placeholder '待补充' treat as missing
            m = re.search(r"^\s*date\s*:\s*(.+)$", fm, flags=re.M)
            if m and m.group(1).strip() and '待补充' not in m.group(1):
                return False, None
        # need to fill
        git_date = run_git_date(path)
        if not git_date:
            return False, None
        git_date = git_date.strip()
        if has_date_in_frontmatter(fm):
            new_fm = re.sub(r"(^\s*date\s*:\s*).+$", f"\1{git_date}", fm, flags=re.M)
        else:
            # insert date at top of frontmatter
            new_fm = f'date: {git_date}\n' + fm
        new_text = '---\n' + new_fm + '---\n' + body
    else:
        # no frontmatter: try to get git date and create frontmatter
        git_date = run_git_date(path)
        if not git_date:
            return False, None
        new_text = '---\n' + f'date: {git_date}\n' + '---\n\n' + text

    if dry_run:
        return True, git_date
    else:
        backup = path.with_suffix(path.suffix + '.bak')
        if not backup.exists():
            path.replace(backup)
            backup.write_text(text, encoding='utf-8')
            path.write_text(new_text, encoding='utf-8')
        else:
            path.write_text(new_text, encoding='utf-8')
        return True, git_date


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--path', default='docs', help='Docs folder to scan')
    parser.add_argument('--apply', action='store_true', help='Apply changes')
    args = parser.parse_args()

    base = Path(args.path)
    if not base.exists():
        print(f'Error: path not found: {base}', file=sys.stderr)
        sys.exit(2)

    updates = []
    for f in sorted(base.rglob('*.md')):
        ok, date = process_file(f, dry_run=not args.apply)
        if ok:
            updates.append((f, date))

    print(f'Found {len(updates)} markdown files to update dates for.')
    for p, d in updates:
        print(f'{p} -> {d}')

    if args.apply and updates:
        print('\nApplying changes...')
        for p, _ in updates:
            process_file(p, dry_run=False)
        print('Applied date updates (backups with .bak).')
    else:
        print('\nDry-run complete. Use --apply to write changes.')


if __name__ == '__main__':
    main()
