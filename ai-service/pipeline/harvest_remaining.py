#!/usr/bin/env python3
"""
harvest_remaining.py — Automated discovery, download, and appendix extraction
for all remaining Kenya counties straight from official Auditor-General portal (oagkenya.go.ke).
"""

import os
import sys
import json
import subprocess
import time
from pathlib import Path

ROOT = Path(__file__).parent
sys.path.append(str(ROOT))
from gen_geography import DATA, CODES

PYTHON = sys.executable

REMAINING_COUNTIES = [
    # Batch 6
    ("Kwale", ["Msambweni", "Lunga Lunga", "Matuga", "Kinango"]),
    ("Tana River", ["Garsen", "Galole", "Bura"]),
    ("Lamu", ["Lamu East", "Lamu West"]),
    ("Taita-Taveta", ["Taveta", "Wundanyi", "Mwatate", "Voi"]),
    ("Wajir", ["Wajir North", "Wajir East", "Tarbaj", "Wajir West", "Eldas", "Wajir South"]),
    ("Mandera", ["Mandera West", "Banissa", "Mandera North", "Mandera South", "Mandera East", "Lafey"]),
    ("Marsabit", ["Moyale", "North Horr", "Saku", "Laisamis"]),
    ("Isiolo", ["Isiolo North", "Isiolo South"]),
    # Batch 7
    ("Tharaka-Nithi", ["Maara", "Chuka/Igambang'ombe", "Tharaka"]),
    ("Embu", ["Manyatta", "Runyenjes", "Mbeere South", "Mbeere North"]),
    ("Nyandarua", ["Kinangop", "Kipipiri", "Ol Kalou", "Ol Jorok", "Ndaragwa"]),
    ("Kirinyaga", ["Mwea", "Gichugu", "Ndia", "Kirinyaga Central"]),
    ("Turkana", ["Turkana North", "Turkana West", "Turkana Central", "Loima", "Turkana South", "Turkana East"]),
    ("West Pokot", ["Kapenguria", "Sigor", "Kacheliba", "Pokot South"]),
    ("Samburu", ["Samburu West", "Samburu North", "Samburu East"]),
    # Batch 8
    ("Trans-Nzoia", ["Kwanza", "Endebess", "Saboti", "Kiminini", "Cherangany"]),
    ("Elgeyo-Marakwet", ["Marakwet East", "Marakwet West", "Keiyo North", "Keiyo South"]),
    ("Baringo", ["Tiaty", "Baringo North", "Baringo Central", "Baringo South", "Mogotio", "Eldama Ravine"]),
    ("Laikipia", ["Laikipia West", "Laikipia East", "Laikipia North"]),
    ("Narok", ["Kilgoris", "Emurua Dikirr", "Narok North", "Narok East", "Narok South", "Narok West"]),
    ("Vihiga", ["Vihiga", "Sabatia", "Hamisi", "Luanda", "Emuhaya"]),
    ("Busia", ["Teso North", "Teso South", "Nambale", "Matayos", "Butula", "Funyula", "Budalangi"]),
    ("Nyamira", ["Kitutu Masaba", "West Mugirango", "North Mugirango", "Borabu"]),
]

def run_county(county, constituencies):
    slug = county.lower().replace(" ", "_").replace("-", "_")
    cdir = ROOT / "counties" / slug
    corpus_dir = cdir / "corpus"
    corpus_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"\n==========================================")
    print(f"HARVESTING: {county} ({len(constituencies)} constituencies)")
    print(f"==========================================")
    
    # Run county_pipeline.sh
    cmd = ["bash", str(ROOT / "county_pipeline.sh"), county] + constituencies
    res = subprocess.run(cmd, cwd=str(ROOT.parent.parent))
    
    # Run appendix_county.py with venv python if available
    venv_py = ROOT.parent / "venv" / "bin" / "python"
    py_bin = str(venv_py) if venv_py.exists() else sys.executable
    
    appendix_cmd = [py_bin, str(ROOT / "appendix_county.py"), str(cdir)]
    subprocess.run(appendix_cmd, cwd=str(ROOT.parent.parent))

def main():
    start = time.time()
    for idx, (county, consts) in enumerate(REMAINING_COUNTIES, 1):
        print(f"[{idx}/{len(REMAINING_COUNTIES)}] Processing {county}...")
        try:
            run_county(county, consts)
        except Exception as e:
            print(f"ERROR harvesting {county}: {e}")
    elapsed = time.time() - start
    print(f"\nFINISHED ALL {len(REMAINING_COUNTIES)} COUNTIES IN {elapsed:.1f}s")

if __name__ == "__main__":
    main()
