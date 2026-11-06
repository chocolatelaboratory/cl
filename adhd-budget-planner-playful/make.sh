#!/bin/sh
# Rebuild the planner: template + src parts, then embed fonts and icons.
set -e
S=${SKILL_DIR:?set SKILL_DIR to the etsy-planner-builder skill folder}
cd "$(dirname "$0")"
python3 build.py $S/assets/starter-template.html
python3 $S/scripts/embed_fonts.py adhd-budget-planner.html --display "Inter Display:700" --body "Inter:400,600,700" >/dev/null
python3 $S/scripts/embed_icons.py adhd-budget-planner.html
