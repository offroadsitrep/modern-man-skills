#!/usr/bin/env python3
"""Bump the CSS cache-busting version string sitewide.

Every HTML file references `assets/styles.css?v=YYYYMMDD-HHMM`. After any CSS
change, run this script to bump the version string everywhere so readers don't
see stale styles from edge caches.

Usage:
    python3 bin/bump-css-version.py            # uses current timestamp
    python3 bin/bump-css-version.py 20260501-0900   # use a specific version

Run from the project root.
"""

import re
import sys
import glob
from datetime import datetime, timezone

PATTERN = re.compile(r'(assets/styles\.css\?v=)([0-9]{8}-[0-9]{4})')


def main():
    if len(sys.argv) > 1:
        new_version = sys.argv[1]
        if not re.match(r'^\d{8}-\d{4}$', new_version):
            print("Version must be YYYYMMDD-HHMM (e.g., 20260501-0900)", file=sys.stderr)
            sys.exit(1)
    else:
        new_version = datetime.now(timezone.utc).strftime('%Y%m%d-%H%M')

    files = sorted(glob.glob('**/*.html', recursive=True))
    changed = 0
    seen_versions = set()

    for filepath in files:
        with open(filepath) as f:
            content = f.read()

        def replace(match):
            seen_versions.add(match.group(2))
            return f"{match.group(1)}{new_version}"

        new_content, count = PATTERN.subn(replace, content)

        if count and new_content != content:
            with open(filepath, 'w') as f:
                f.write(new_content)
            changed += 1

    if seen_versions:
        old_str = ', '.join(sorted(seen_versions))
    else:
        old_str = '(none found)'

    print(f"Bumped CSS version: {old_str} -> {new_version}")
    print(f"Files updated: {changed}/{len(files)}")


if __name__ == '__main__':
    main()
