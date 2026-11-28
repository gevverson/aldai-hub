#!/usr/bin/env python3
"""Generate the national geography.js from the authoritative county list."""
import json
from pathlib import Path
ROOT = Path(__file__).parent

# County -> constituencies, from Wikipedia "Constituencies of Kenya"
# (IEBC First Schedule). Verified: 47 counties, 290 constituencies.
DATA = {
    "Mombasa": ["Changamwe","Jomvu","Kisauni","Nyali","Likoni","Mvita"],
    "Kwale": ["Msambweni","Lunga Lunga","Matuga","Kinango"],
    "Kilifi": ["Kilifi North","Kilifi South","Kaloleni","Rabai","Ganze","Malindi","Magarini"],
    "Tana River": ["Garsen","Galole","Bura"],
    "Lamu": ["Lamu East","Lamu West"],
    "Taita-Taveta": ["Taveta","Wundanyi","Mwatate","Voi"],
    "Garissa": ["Garissa Township","Balambala","Lagdera","Dadaab","Fafi","Ijara"],
    "Wajir": ["Wajir North","Wajir East","Tarbaj","Wajir West","Eldas","Wajir South"],
    "Mandera": ["Mandera West","Banissa","Mandera North","Mandera South","Mandera East","Lafey"],
    "Marsabit": ["Moyale","North Horr","Saku","Laisamis"],
    "Isiolo": ["Isiolo North","Isiolo South"],
    "Meru": ["Igembe South","Igembe Central","Igembe North","Tigania West","Tigania East","North Imenti","Buuri","Central Imenti","South Imenti"],
    "Tharaka-Nithi": ["Maara","Chuka/Igambang'ombe","Tharaka"],
    "Embu": ["Manyatta","Runyenjes","Mbeere South","Mbeere North"],
    "Kitui": ["Mwingi North","Mwingi West","Mwingi Central","Kitui West","Kitui Rural","Kitui Central","Kitui East","Kitui South"],
    "Machakos": ["Masinga","Yatta","Kangundo","Matungulu","Kathiani","Mavoko","Machakos Town","Mwala"],
    "Makueni": ["Mbooni","Kilome","Kaiti","Makueni","Kibwezi West","Kibwezi East"],
    "Nyandarua": ["Kinangop","Kipipiri","Ol Kalou","Ol Jorok","Ndaragwa"],
    "Nyeri": ["Tetu","Kieni","Mathira","Othaya","Mukurweini","Nyeri Town"],
    "Kirinyaga": ["Mwea","Gichugu","Ndia","Kirinyaga Central"],
    "Murang'a": ["Kangema","Mathioya","Kiharu","Kigumo","Maragwa","Kandara","Gatanga"],
    "Kiambu": ["Gatundu South","Gatundu North","Juja","Thika Town","Ruiru","Githunguri","Kiambu","Kiambaa","Kabete","Kikuyu","Limuru","Lari"],
    "Turkana": ["Turkana North","Turkana West","Turkana Central","Loima","Turkana South","Turkana East"],
    "West Pokot": ["Kapenguria","Sigor","Kacheliba","Pokot South"],
    "Samburu": ["Samburu West","Samburu North","Samburu East"],
    "Trans-Nzoia": ["Kwanza","Endebess","Saboti","Kiminini","Cherangany"],
    "Uasin Gishu": ["Soy","Turbo","Moiben","Ainabkoi","Kapseret","Kesses"],
    "Elgeyo-Marakwet": ["Marakwet East","Marakwet West","Keiyo North","Keiyo South"],
    "Nandi": ["Tinderet","Aldai","Nandi Hills","Chesumei","Emgwen","Mosop"],
    "Baringo": ["Tiaty","Baringo North","Baringo Central","Baringo South","Mogotio","Eldama Ravine"],
    "Laikipia": ["Laikipia West","Laikipia East","Laikipia North"],
    "Nakuru": ["Molo","Njoro","Naivasha","Gilgil","Kuresoi South","Kuresoi North","Subukia","Rongai","Bahati","Nakuru Town West","Nakuru Town East"],
    "Narok": ["Kilgoris","Emurua Dikirr","Narok North","Narok East","Narok South","Narok West"],
    "Kajiado": ["Kajiado North","Kajiado Central","Kajiado East","Kajiado West","Kajiado South"],
    "Kericho": ["Kipkelion East","Kipkelion West","Ainamoi","Bureti","Belgut","Sigowet-Soin"],
    "Bomet": ["Sotik","Chepalungu","Bomet East","Bomet Central","Konoin"],
    "Kakamega": ["Lugari","Likuyani","Malava","Lurambi","Navakholo","Mumias West","Mumias East","Matungu","Butere","Khwisero","Shinyalu","Ikolomani"],
    "Vihiga": ["Vihiga","Sabatia","Hamisi","Luanda","Emuhaya"],
    "Bungoma": ["Mount Elgon","Sirisia","Kabuchai","Bumula","Kanduyi","Webuye East","Webuye West","Kimilili","Tongaren"],
    "Busia": ["Teso North","Teso South","Nambale","Matayos","Butula","Funyula","Budalangi"],
    "Siaya": ["Ugenya","Ugunja","Alego Usonga","Gem","Bondo","Rarieda"],
    "Kisumu": ["Kisumu East","Kisumu West","Kisumu Central","Seme","Nyando","Muhoroni","Nyakach"],
    "Homa Bay": ["Kasipul","Kabondo Kasipul","Karachuonyo","Rangwe","Homa Bay Town","Ndhiwa","Suba North","Suba South"],
    "Migori": ["Rongo","Awendo","Suna East","Suna West","Uriri","Nyatike","Kuria West","Kuria East"],
    "Kisii": ["Bonchari","South Mugirango","Bomachoge Borabu","Bobasi","Bomachoge Chache","Nyaribari Masaba","Nyaribari Chache","Kitutu Chache North","Kitutu Chache South"],
    "Nyamira": ["Kitutu Masaba","West Mugirango","North Mugirango","Borabu"],
    "Nairobi": ["Westlands","Dagoretti North","Dagoretti South","Lang'ata","Kibra","Roysambu","Kasarani","Ruaraka","Embakasi South","Embakasi North","Embakasi Central","Embakasi East","Embakasi West","Makadara","Kamukunji","Starehe","Mathare"],
}

# IEBC county codes (First Schedule order).
CODES = {n: i+1 for i, n in enumerate([
    "Mombasa","Kwale","Kilifi","Tana River","Lamu","Taita-Taveta","Garissa","Wajir",
    "Mandera","Marsabit","Isiolo","Meru","Tharaka-Nithi","Embu","Kitui","Machakos",
    "Makueni","Nyandarua","Nyeri","Kirinyaga","Murang'a","Kiambu","Turkana","West Pokot",
    "Samburu","Trans-Nzoia","Uasin Gishu","Elgeyo-Marakwet","Nandi","Baringo","Laikipia",
    "Nakuru","Narok","Kajiado","Kericho","Bomet","Kakamega","Vihiga","Bungoma","Busia",
    "Siaya","Kisumu","Homa Bay","Migori","Kisii","Nyamira","Nairobi",
])}

# Constituencies with OAG per-project data actually ingested and verified.
# Coverage is at CONSTITUENCY level (many counties publish narrative-only
# reports). Derived directly from national_projects.json so the covered flags
# can never drift from the data that actually exists.

# Importable as a module: `DATA` above is the canonical IEBC county →
# constituency list, and build_findings.py resolves report filenames against
# it. Generating geography.js is a side effect nobody importing that list
# asked for, so it only happens when this file is run directly.
def main():
    import json as _json
    COVERED = {}
    _proj = ROOT / "national_projects.json"
    if _proj.exists():
        for _r in _json.loads(_proj.read_text()):
            if _r.get("constituency"):
                COVERED.setdefault(_r["county"], set()).add(_r["constituency"])

    n_counties = len(DATA)
    n_const = sum(len(v) for v in DATA.values())
    assert n_counties == 47, f"expected 47 counties, got {n_counties}"
    assert n_const == 290, f"expected 290 constituencies, got {n_const}"
    assert set(CODES) == set(DATA), "code/county mismatch"

    # Emit ordered by county code (canonical), so the file is stable.
    ordered = sorted(DATA.items(), key=lambda kv: CODES[kv[0]])

    lines = [
        "/**",
        " * geography.js — Kenya's 47 counties and 290 constituencies.",
        " *",
        " * Source: IEBC / Constitution First Schedule (via Wikipedia",
        " * \"Constituencies of Kenya\"), verified at 47 counties / 290 constituencies.",
        " * This is authoritative administrative data — the navigation backbone.",
        " *",
        " * `covered: true` marks constituencies whose OAG audit data has actually",
        " * been ingested and verified. Everything else shows honestly as \"data",
        " * coming\" — the map of the country is complete; the evidence fills in as",
        " * each county's Auditor-General reports are processed. We never mark a",
        " * place covered before its primary-source data exists.",
        " *",
        " * Regenerate: scratchpad/gen_geography.py",
        " */",
        "",
        "export const counties = [",
    ]
    for name, consts in ordered:
        cov = COVERED.get(name, set())
        lines.append("  {")
        lines.append(f"    name: {json.dumps(name)},")
        lines.append(f"    code: {CODES[name]},")
        lines.append("    constituencies: [")
        for c in consts:
            flag = "true " if c in cov else "false"
            lines.append(f"      {{ name: {json.dumps(c)}, covered: {flag} }},")
        lines.append("    ],")
        lines.append("  },")
    lines.append("];")
    lines.append("")
    lines.append("/** Flat list of every constituency, each tagged with its county. */")
    lines.append("export const allConstituencies = counties.flatMap((c) =>")
    lines.append("  c.constituencies.map((k) => ({ ...k, county: c.name }))")
    lines.append(");")
    lines.append("")
    lines.append("export const findCounty = (name) =>")
    lines.append("  counties.find((c) => c.name.toLowerCase() === String(name).toLowerCase());")
    lines.append("")
    lines.append("export const findConstituency = (name) =>")
    lines.append("  allConstituencies.find(")
    lines.append("    (k) => k.name.toLowerCase() === String(name).toLowerCase()")
    lines.append("  );")
    lines.append("")

    out = ROOT.parents[1] / "server" / "data" / "geography.js"
    out.write_text("\n".join(lines))
    print(f"wrote {out}")
    print(f"{n_counties} counties, {n_const} constituencies")
    print(f"covered: {sum(len(v) for v in COVERED.values())} constituencies")



if __name__ == "__main__":
    main()
