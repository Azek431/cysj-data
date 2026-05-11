#!/usr/bin/env python3
"""
fill_missing_frontmatter.py

Scan the `docs/` folder for markdown files missing a `title` in their YAML frontmatter.
If a title is missing, the script extracts the first H1 (`# Title`) from the file or
falls back to the filename, then inserts a `title: "..."` into the frontmatter (or
creates frontmatter if absent).

Usage:
  python scripts/fill_missing_frontmatter.py        # dry-run, list files
  python scripts/fill_missing_frontmatter.py --apply  # apply changes
  python scripts/fill_missing_frontmatter.py --path mydocs --apply
"""

from pathlib import Path
import re
import argparse
import sys


def extract_first_h1(text: str):
    m = re.search(r"^\s*#\s+(.+)$", text, flags=re.M)
    if m:
        return m.group(1).strip()
    return None


def slug_to_title(path: Path):
    name = path.stem
    name = re.sub(r"[-_]+", " ", name)
    name = name.strip()
    # Preserve existing characters; just capitalize first char
    if not name:
        return path.name
    return name[0].upper() + name[1:]


def has_title_in_frontmatter(fm: str):
    return re.search(r"^\s*title\s*:", fm, flags=re.M) is not None


def process_file(path: Path, dry_run: bool = True):
    try:
        text = path.read_text(encoding="utf-8")
    except Exception:
        try:
            text = path.read_text(encoding="utf-8", errors="replace")
        except Exception as e:
            print(f"ERROR reading {path}: {e}")
            return False, None

    fm_match = re.match(r"^---\s*\n(.*?\n)---\s*\n?", text, flags=re.S)

    if fm_match:
        fm = fm_match.group(1)
        body = text[fm_match.end():]
        if has_title_in_frontmatter(fm):
            return False, None
        candidate = extract_first_h1(body) or slug_to_title(path)
        candidate = candidate.replace('"', '\\"')
        new_fm = f'title: "{candidate}"\n' + fm
        new_text = '---\n' + new_fm + '---\n' + body
    else:
        body = text
        candidate = extract_first_h1(body) or slug_to_title(path)
        candidate = candidate.replace('"', '\\"')
        new_text = '---\n' + f'title: "{candidate}"\n' + '---\n\n' + body

    if dry_run:
        return True, candidate
    else:
        # Backup original
        backup = path.with_suffix(path.suffix + '.bak')
        if not backup.exists():
            path.replace(backup)
            backup.write_text(text, encoding='utf-8')
            # restore original path by writing new content
            path.write_text(new_text, encoding='utf-8')
        else:
            # if backup exists, just overwrite file
            path.write_text(new_text, encoding='utf-8')
        return True, candidate


def main():
    parser = argparse.ArgumentParser(description="Fill missing frontmatter titles in docs/")
    parser.add_argument('--path', default='docs', help='Docs folder to scan')
    parser.add_argument('--apply', action='store_true', help='Apply changes')
    args = parser.parse_args()

    base = Path(args.path)
    if not base.exists():
        print(f'Error: path not found: {base}', file=sys.stderr)
        sys.exit(2)

    candidates = []
    for f in sorted(base.rglob('*.md')):
        ok, candidate = process_file(f, dry_run=not args.apply)
        if ok:
            candidates.append((f, candidate))

    print(f'Found {len(candidates)} markdown files that would be updated.' )
    for p, c in candidates:
        print(f'{p} -> "{c}"')

    if args.apply and candidates:
        print('\nApplying changes...')
        for p, _ in candidates:
            process_file(p, dry_run=False)
        print('Applied changes to files (backups with .bak).')
    else:
        print('\nDry-run complete. Use --apply to write changes.')


if __name__ == '__main__':
    main()
