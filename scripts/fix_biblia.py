#!/usr/bin/env python3
"""
Fix Biblia Mundial 2026 — post-integration patches
====================================================
1. Merge `photo_url` from backup (data/teams.backup.20260509/) into the new
   Biblia teams (data/teams/*.json), matching by player name (normalized).
2. Replace `group_2026: { letter: "[POR CONFIRMAR]" }` with the real group
   data using the canonical roster from data/calendario.ts.

Run from repo root:
    py -3.14 scripts/fix_biblia.py
"""
import json
import os
import re
import unicodedata
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
TEAMS_DIR = REPO / "data" / "teams"
BACKUP_DIR = REPO / "data" / "teams.backup.20260509"


# ============================================================================
# 1. Real groups (from data/calendario.ts comments — verified)
# ============================================================================
GROUPS = {
    "A": ["mexico", "corea-del-sur", "sudafrica", "republica-checa"],
    "B": ["canada", "suiza", "qatar", "bosnia"],
    "C": ["brasil", "marruecos", "haiti", "escocia"],
    "D": ["estados-unidos", "australia", "paraguay", "turquia"],
    "E": ["alemania", "curazao", "costa-de-marfil", "ecuador"],
    "F": ["paises-bajos", "japon", "tunez", "suecia"],
    "G": ["belgica", "egipto", "iran", "nueva-zelanda"],
    "H": ["espana", "cabo-verde", "arabia-saudi", "uruguay"],
    "I": ["francia", "senegal", "noruega", "irak"],
    "J": ["argentina", "argelia", "austria", "jordania"],
    "K": ["portugal", "colombia", "uzbekistan", "rd-congo"],
    "L": ["inglaterra", "croacia", "ghana", "panama"],
}

# Slug → group letter (reverse index)
SLUG_TO_GROUP = {slug: letter for letter, slugs in GROUPS.items() for slug in slugs}


def slug_to_iso(slug):
    """Map team slug to ISO code (used in flag URLs)."""
    return {
        "mexico": "mx",
        "corea-del-sur": "kr",
        "sudafrica": "za",
        "republica-checa": "cz",
        "canada": "ca",
        "suiza": "ch",
        "qatar": "qa",
        "bosnia": "ba",
        "brasil": "br",
        "marruecos": "ma",
        "haiti": "ht",
        "escocia": "gb-sct",
        "estados-unidos": "us",
        "australia": "au",
        "paraguay": "py",
        "turquia": "tr",
        "alemania": "de",
        "curazao": "cw",
        "costa-de-marfil": "ci",
        "ecuador": "ec",
        "paises-bajos": "nl",
        "japon": "jp",
        "tunez": "tn",
        "suecia": "se",
        "belgica": "be",
        "egipto": "eg",
        "iran": "ir",
        "nueva-zelanda": "nz",
        "espana": "es",
        "cabo-verde": "cv",
        "arabia-saudi": "sa",
        "uruguay": "uy",
        "francia": "fr",
        "senegal": "sn",
        "noruega": "no",
        "irak": "iq",
        "argentina": "ar",
        "argelia": "dz",
        "austria": "at",
        "jordania": "jo",
        "portugal": "pt",
        "colombia": "co",
        "uzbekistan": "uz",
        "rd-congo": "cd",
        "inglaterra": "gb-eng",
        "croacia": "hr",
        "ghana": "gh",
        "panama": "pa",
    }.get(slug)


def slug_to_name(slug):
    """Map slug to human-readable Spanish name."""
    return {
        "mexico": "México",
        "corea-del-sur": "Corea del Sur",
        "sudafrica": "Sudáfrica",
        "republica-checa": "Chequia",
        "canada": "Canadá",
        "suiza": "Suiza",
        "qatar": "Qatar",
        "bosnia": "Bosnia y Herzegovina",
        "brasil": "Brasil",
        "marruecos": "Marruecos",
        "haiti": "Haití",
        "escocia": "Escocia",
        "estados-unidos": "Estados Unidos",
        "australia": "Australia",
        "paraguay": "Paraguay",
        "turquia": "Turquía",
        "alemania": "Alemania",
        "curazao": "Curazao",
        "costa-de-marfil": "Costa de Marfil",
        "ecuador": "Ecuador",
        "paises-bajos": "Países Bajos",
        "japon": "Japón",
        "tunez": "Túnez",
        "suecia": "Suecia",
        "belgica": "Bélgica",
        "egipto": "Egipto",
        "iran": "Irán",
        "nueva-zelanda": "Nueva Zelanda",
        "espana": "España",
        "cabo-verde": "Cabo Verde",
        "arabia-saudi": "Arabia Saudí",
        "uruguay": "Uruguay",
        "francia": "Francia",
        "senegal": "Senegal",
        "noruega": "Noruega",
        "irak": "Irak",
        "argentina": "Argentina",
        "argelia": "Argelia",
        "austria": "Austria",
        "jordania": "Jordania",
        "portugal": "Portugal",
        "colombia": "Colombia",
        "uzbekistan": "Uzbekistán",
        "rd-congo": "RD Congo",
        "inglaterra": "Inglaterra",
        "croacia": "Croacia",
        "ghana": "Ghana",
        "panama": "Panamá",
    }.get(slug, slug.title())


# ============================================================================
# 2. Helpers
# ============================================================================
def normalize_name(name):
    """Normalize a player name for matching: strip accents, lowercase, remove
    punctuation. So `Lionel Andrés Messi` matches `Lionel Messi`."""
    if not name:
        return ""
    n = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode("ascii")
    n = re.sub(r"[^a-zA-Z\s]", "", n).lower()
    return " ".join(n.split())


def name_match(a, b):
    """Two names match if their normalized last words overlap (stricter than
    substring; tolerates middle names like Jude Bellingham vs Jude Victor William
    Bellingham)."""
    na = set(normalize_name(a).split())
    nb = set(normalize_name(b).split())
    if not na or not nb:
        return False
    # Match if at least 2 tokens match OR last name matches and 1 first name
    common = na & nb
    return len(common) >= 2


# ============================================================================
# 3. Merge photo_url from backup
# ============================================================================
def merge_photos(slug):
    """Returns (matched, total_squad)."""
    new_path = TEAMS_DIR / f"{slug}.json"
    if not new_path.exists():
        return (0, 0)
    with new_path.open("r", encoding="utf-8") as f:
        new = json.load(f)
    new_squad = new.get("wc_2026", {}).get("likely_squad", [])
    if not new_squad:
        return (0, 0)

    # Try matching backup files: same slug + (chequia ↔ republica-checa) + (usa ↔ estados-unidos)
    backup_candidates = [slug]
    if slug == "republica-checa":
        backup_candidates.append("chequia")
    elif slug == "estados-unidos":
        backup_candidates.append("usa")

    backup_squad = None
    for cand in backup_candidates:
        bp = BACKUP_DIR / f"{cand}.json"
        if bp.exists():
            with bp.open("r", encoding="utf-8") as f:
                backup_squad = json.load(f).get("wc_2026", {}).get("likely_squad", [])
            break

    if not backup_squad:
        return (0, len(new_squad))

    # Build id → photo_url index from backup (id is the canonical identifier).
    # Fallback to full_name matching if id missing.
    by_id = {}
    by_name = []
    for bp in backup_squad:
        if not bp.get("photo_url"):
            continue
        if bp.get("id"):
            by_id[bp["id"]] = bp["photo_url"]
        if bp.get("full_name"):
            by_name.append({"full_name": bp["full_name"], "photo_url": bp["photo_url"]})

    matched = 0
    for player in new_squad:
        # 1. Try matching by id (most reliable)
        pid = player.get("id")
        if pid and pid in by_id:
            player["photo_url"] = by_id[pid]
            matched += 1
            continue
        # 2. Fallback to name matching
        name = player.get("full_name") or player.get("display_name") or player.get("name") or ""
        for bp in by_name:
            if name_match(name, bp["full_name"]):
                player["photo_url"] = bp["photo_url"]
                matched += 1
                break

    # Persist
    with new_path.open("w", encoding="utf-8") as f:
        json.dump(new, f, ensure_ascii=False, indent=2)

    return (matched, len(new_squad))


# ============================================================================
# 4. Fix [POR CONFIRMAR] groups
# ============================================================================
def fix_group(slug):
    """If the team has group_2026.letter == "[POR CONFIRMAR]", replace with
    the real group data. Returns True if patched."""
    new_path = TEAMS_DIR / f"{slug}.json"
    if not new_path.exists():
        return False
    with new_path.open("r", encoding="utf-8") as f:
        team = json.load(f)
    g = team.get("wc_2026", {}).get("group_2026", {})
    if g.get("letter") != "[POR CONFIRMAR]":
        return False
    real_letter = SLUG_TO_GROUP.get(slug)
    if not real_letter:
        return False
    # Build the team list from canonical roster
    teams_in_group = []
    for s in GROUPS[real_letter]:
        teams_in_group.append({
            "iso": slug_to_iso(s),
            "name": slug_to_name(s),
            "fifa_rank": None,  # Optional — not authoritative here
            "is_seed": s == slug,  # We mark THIS team as seed since it was originally [POR CONFIRMAR] (Bombo 1)
        })
    # Preserve the original 'is_seed' flag from team[0] (the team itself)
    original_self = next((t for t in g.get("teams", []) if t.get("name") not in ("[POR CONFIRMAR]", None)), None)
    if original_self:
        original_seed = original_self.get("is_seed", False)
        for t in teams_in_group:
            if t["name"] == slug_to_name(slug):
                t["is_seed"] = original_seed

    team["wc_2026"]["group_2026"] = {
        "letter": real_letter,
        "label": f"Grupo {real_letter} — Mundial 2026",
        "teams": teams_in_group,
        "notes": g.get("notes", ""),
    }
    with new_path.open("w", encoding="utf-8") as f:
        json.dump(team, f, ensure_ascii=False, indent=2)
    return True


def slug_to_country_iso(slug):
    """ISO country code (different from team iso for England/Scotland)."""
    iso = slug_to_iso(slug)
    if iso and "-" in iso:
        # gb-eng → gb (country), gb-sct → gb
        return iso.split("-")[0]
    return iso


# ============================================================================
# 5. Fix schedule (3 group-stage matches per team) using data/calendario.ts
# ============================================================================
def parse_calendario():
    """Parse `src/data/calendario.ts` and return a list of matches."""
    cal_path = REPO / "src" / "data" / "calendario.ts"
    if not cal_path.exists():
        return []
    text = cal_path.read_text(encoding="utf-8")
    # Each match line:
    # { id: "I1", grupo: "I", jornada: 1, fecha: "2026-06-12T19:00:00Z", estadio: "...", ciudad: "...", homeSlug: "francia", awaySlug: "senegal" },
    pattern = re.compile(
        r'\{\s*id:\s*"([^"]+)",\s*grupo:\s*"([^"]+)",\s*jornada:\s*(\d+),'
        r'\s*fecha:\s*"([^"]+)",\s*estadio:\s*"([^"]+)",\s*ciudad:\s*"([^"]+)",'
        r'\s*homeSlug:\s*"([^"]+)",\s*awaySlug:\s*"([^"]+)"\s*\},?'
    )
    matches = []
    for m in pattern.finditer(text):
        matches.append({
            "id": m.group(1),
            "grupo": m.group(2),
            "jornada": int(m.group(3)),
            "fecha": m.group(4),
            "estadio": m.group(5),
            "ciudad": m.group(6),
            "homeSlug": m.group(7),
            "awaySlug": m.group(8),
        })
    return matches


def fix_schedule(slug, all_matches):
    """Replace POR CONFIRMAR opponents in schedule with the real opponent
    using the canonical calendario.ts roster."""
    new_path = TEAMS_DIR / f"{slug}.json"
    if not new_path.exists():
        return "skip"
    with new_path.open("r", encoding="utf-8") as f:
        team = json.load(f)
    schedule = team.get("wc_2026", {}).get("schedule")
    if not schedule:
        return "no-schedule"

    # Build the team's match list ordered by jornada
    own_matches = []
    for m in all_matches:
        if m["homeSlug"] == slug or m["awaySlug"] == slug:
            opponent_slug = m["awaySlug"] if m["homeSlug"] == slug else m["homeSlug"]
            own_matches.append({
                "matchday": m["jornada"],
                "opponent_slug": opponent_slug,
                "fecha": m["fecha"],
                "estadio": m["estadio"],
                "ciudad": m["ciudad"],
            })
    own_matches.sort(key=lambda x: x["matchday"])

    if len(own_matches) != 3:
        return f"unexpected-{len(own_matches)}-matches"

    # Patch each entry in the schedule
    patched_count = 0
    for entry in schedule:
        md = entry.get("matchday")
        match = next((m for m in own_matches if m["matchday"] == md), None)
        if not match:
            continue
        # Only patch if currently POR CONFIRMAR
        if entry.get("opponent", {}).get("name") != "[POR CONFIRMAR]":
            continue
        opp_slug = match["opponent_slug"]
        entry["opponent"] = {
            "iso": slug_to_iso(opp_slug),
            "name": slug_to_name(opp_slug),
        }
        entry["date"] = match["fecha"]
        entry["venue"] = {
            "stadium": match["estadio"],
            "city": match["ciudad"],
            "country_iso": entry.get("venue", {}).get("country_iso", "us"),
        }
        patched_count += 1

    if patched_count > 0:
        with new_path.open("w", encoding="utf-8") as f:
            json.dump(team, f, ensure_ascii=False, indent=2)
        return f"patched-{patched_count}"
    return "ok"


# ============================================================================
# 6. Fix kit front_url placeholders
# ============================================================================
KITS_DIR = REPO / "public" / "img" / "kits" / "2026" / "home"


def fix_kit_url(slug):
    """Replace `[PLACEHOLDER: /img/kits/2026/home/<x>.svg]` with the real
    PNG path if a file exists for this slug. Returns the action taken."""
    new_path = TEAMS_DIR / f"{slug}.json"
    if not new_path.exists():
        return "skip"
    with new_path.open("r", encoding="utf-8") as f:
        team = json.load(f)
    kit = team.get("kit", {})
    wc = kit.get("wc_2026", {})
    home = wc.get("home")
    if not home:
        return "no-home"

    # If file exists for this slug, use it directly
    candidate = KITS_DIR / f"{slug}.png"

    # Special handling for renamed slugs
    if not candidate.exists() and slug == "republica-checa":
        # The legacy file is chequia.png — rename it
        legacy = KITS_DIR / "chequia.png"
        if legacy.exists():
            new_name = KITS_DIR / "republica-checa.png"
            legacy.rename(new_name)
            candidate = new_name

    if candidate.exists():
        new_url = f"/img/kits/2026/home/{slug}.png"
        old_url = home.get("front_url", "")
        if old_url == new_url:
            return "ok"
        home["front_url"] = new_url
        with new_path.open("w", encoding="utf-8") as f:
            json.dump(team, f, ensure_ascii=False, indent=2)
        return f"fixed -> {new_url}"
    else:
        return "no-png"


# ============================================================================
# 6. Main
# ============================================================================
def main():
    print("=" * 60)
    print("FIX BIBLIA — Merge photos + fix groups")
    print("=" * 60)

    print("\n[1/2] Merging photo_url from backup...")
    total_matched = 0
    total_squad = 0
    no_match = []
    for f in sorted(os.listdir(TEAMS_DIR)):
        if not f.endswith(".json") or f.startswith("_"):
            continue
        slug = f.replace(".json", "")
        matched, squad_size = merge_photos(slug)
        total_matched += matched
        total_squad += squad_size
        if matched == 0 and squad_size > 0:
            no_match.append(slug)
        elif matched > 0:
            print(f"  {slug}: {matched}/{squad_size} fotos")
    print(f"\n  TOTAL: {total_matched} / {total_squad} jugadores con foto")
    if no_match:
        print(f"  Sin matches ({len(no_match)}):")
        for s in no_match:
            print(f"    - {s}")

    print("\n[2/2] Arreglando group_2026 [POR CONFIRMAR]...")
    patched = []
    for f in sorted(os.listdir(TEAMS_DIR)):
        if not f.endswith(".json") or f.startswith("_"):
            continue
        slug = f.replace(".json", "")
        if fix_group(slug):
            patched.append(slug)
    print(f"  Arreglados: {len(patched)}")
    for s in patched:
        print(f"    - {s} -> Grupo {SLUG_TO_GROUP[s]}")

    print("\n[3/4] Arreglando schedule (POR CONFIRMAR -> partidos reales)...")
    all_matches = parse_calendario()
    print(f"  {len(all_matches)} partidos parseados de calendario.ts")
    sched_patched = []
    for f in sorted(os.listdir(TEAMS_DIR)):
        if not f.endswith(".json") or f.startswith("_"):
            continue
        slug = f.replace(".json", "")
        result = fix_schedule(slug, all_matches)
        if result.startswith("patched"):
            sched_patched.append((slug, result))
    print(f"  Schedules arreglados: {len(sched_patched)}")
    for s, r in sched_patched[:50]:
        print(f"    - {s}: {r}")

    print("\n[4/4] Arreglando kit.front_url (placeholders -> PNG real)...")
    fixed_kit = []
    no_png = []
    for f in sorted(os.listdir(TEAMS_DIR)):
        if not f.endswith(".json") or f.startswith("_"):
            continue
        slug = f.replace(".json", "")
        result = fix_kit_url(slug)
        if result.startswith("fixed"):
            fixed_kit.append(slug)
        elif result == "no-png":
            no_png.append(slug)
    print(f"  PNG encontrado y front_url actualizado: {len(fixed_kit)}")
    for s in fixed_kit[:50]:
        print(f"    - {s}")
    if no_png:
        print(f"  Sin PNG disponible ({len(no_png)}):")
        for s in no_png:
            print(f"    - {s}")

    print("\n[OK] Done.")


if __name__ == "__main__":
    main()
