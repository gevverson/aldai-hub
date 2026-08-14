#!/usr/bin/env python3
"""
compile_national_datasets.py — Master dataset merger and compiler for countrywide expansion.
Combines baseline findings and projects with newly harvested county data across all 47 Kenya counties.
"""

import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).parent
sys.path.append(str(ROOT))

def merge_findings():
    print("--- MERGING FINDINGS ---")
    try:
        prev_raw = subprocess.check_output(["git", "show", "HEAD:ai-service/pipeline/national_findings.json"]).decode("utf-8")
        prev_findings = json.loads(prev_raw)
    except Exception as e:
        print(f"Warning loading HEAD findings: {e}")
        prev_findings = []

    with open(ROOT / "national_findings.json") as f:
        curr_findings = json.load(f)

    combined = {}
    for f in prev_findings + curr_findings:
        key = (f["county"], f["constituency"], f["year"], f["heading"])
        combined[key] = f

    all_findings = list(combined.values())
    out_path = ROOT / "national_findings.json"
    out_path.write_text(json.dumps(all_findings, indent=2, ensure_ascii=False))
    
    counties = set(f["county"] for f in all_findings)
    print(f"✅ Saved {len(all_findings)} findings across {len(counties)} counties -> {out_path}")

def merge_projects():
    print("\n--- MERGING PROJECTS ---")
    try:
        prev_raw = subprocess.check_output(["git", "show", "HEAD:ai-service/pipeline/national_projects.json"]).decode("utf-8")
        prev_projects = json.loads(prev_raw)
    except Exception as e:
        print(f"Warning loading HEAD projects: {e}")
        prev_projects = []

    with open(ROOT / "national_projects.json") as f:
        curr_projects = json.load(f)

    STATUS_RANK = {
        "GHOST PROJECT": 6, "STALLED": 5, "DISPUTED": 4, "INCOMPLETE": 3,
        "COMPLETE": 2, "REPORTED — SEE NOTE": 1, "REPORTED — NO VERIFICATION RESULT": 0,
    }

    best = {}
    for r in prev_projects + curr_projects:
        key = (r["county"], r.get("constituency"), re.sub(r"\s+", " ", r["name"].lower()).strip(), r.get("allocated"))
        cur = best.get(key)
        if cur is None or STATUS_RANK.get(r.get("communityStatus"), 0) > STATUS_RANK.get(cur.get("communityStatus"), 0):
            best[key] = r

    all_projects = list(best.values())
    out_path = ROOT / "national_projects.json"
    out_path.write_text(json.dumps(all_projects, indent=2, ensure_ascii=False))

    counties = set(p["county"] for p in all_projects)
    print(f"✅ Saved {len(all_projects)} projects across {len(counties)} counties -> {out_path}")

def main():
    merge_findings()
    merge_projects()
    
    print("\n--- REGENERATING GEOGRAPHY.JS ---")
    subprocess.run([sys.executable, str(ROOT / "gen_geography.py")], check=True)
    
    print("\n--- BUILDING DB SEED FILES ---")
    subprocess.run([sys.executable, str(ROOT / "build_seed.py")], check=True)
    print("✅ All national datasets successfully compiled.")

if __name__ == "__main__":
    main()
