import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

FILES_TO_CHECK = [
    "index.html",
    "css/styles.css",
    "js/config.js",
    "js/i18n.js",
    "js/data-loader.js",
    "js/ontology.js",
    "js/graph-data.js",
    "js/main.js",
    "js/graph/node-renderer.js",
    "js/graph/link-renderer.js",
    "js/graph/simulation.js",
    "js/interactions/filters.js",
    "js/interactions/node-details.js",
]

errors = []
for rel in FILES_TO_CHECK:
    path = ROOT / rel
    text = path.read_text(encoding="utf-8")
    if "Matthieu GRALL" not in text:
        errors.append(f"{rel}: missing author attribution")
    if "CC BY 4.0" not in text and "Creative Commons" not in text:
        errors.append(f"{rel}: missing license mention")

html = (ROOT / "index.html").read_text(encoding="utf-8")
if 'id="fileLoadButton"' not in html or 'id="filut"' not in html:
    errors.append("index.html: missing file loader controls expected by main.js")

main_js = (ROOT / "js/main.js").read_text(encoding="utf-8")
if 'fileLoadButton' not in main_js or 'filut' not in main_js:
    errors.append("js/main.js: missing file loader wiring")

if errors:
    print("SMOKE CHECK FAILED")
    for error in errors:
        print(f"- {error}")
    sys.exit(1)

print("SMOKE CHECK PASSED")
