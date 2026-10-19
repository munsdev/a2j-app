#!/usr/bin/env python3
"""Build public/esco/onet.json: interest profile, preparation level and a few
work context and physical measures for every ESCO occupation, from O*NET data.

Usage:
  python3 tools/build_onet.py CROSSWALK.csv ONET_TEXT_DIR public/esco/en.json public/esco/onet.json

CROSSWALK.csv  the ESCO to O*NET crosswalk from the ESCO portal
               (esco.ec.europa.eu, "Other crosswalks", ONET_(Occupations)_0_updated.csv)
ONET_TEXT_DIR  the unzipped O*NET database, text version (onetcenter.org, db_31_0_text.zip)

Also reads data/german-level.csv: the German level a job needs, only where an open
source (a law or regulation) states it. See data/README.md.

ESCO occupations are matched to crosswalk rows by their English preferred label,
because the ESCO files shipped with the app carry no URIs. Each ESCO occupation
gets the weighted average of its linked O*NET occupations, weighted by match type.

O*NET data: O*NET 31.0 Database by the U.S. Department of Labor, Employment and
Training Administration (USDOL/ETA), used under CC BY 4.0. Modified: averaged
across crosswalk links and rescaled. USDOL/ETA has not approved, endorsed or
tested these modifications.
"""
import csv, json, os, sys
from collections import defaultdict

WEIGHT = {"exactMatch": 1.0, "narrowMatch": 0.8, "closeMatch": 0.6, "broadMatch": 0.4}
RIASEC = ["Realistic", "Investigative", "Artistic", "Social", "Enterprising", "Conventional"]
# app key -> list of O*NET work context element ids (CX scale, 1 to 5); max is taken
CONTEXT = {
    "contact": ["4.C.1.a.4"],            # contact with others
    "customers": ["4.C.1.b.1.f"],        # deal with external customers or the public
    "outdoors": ["4.C.2.a.1.c", "4.C.2.a.1.d"],
    "standing": ["4.C.2.d.1.b"],
    "sitting": ["4.C.2.d.1.a"],
    "hands": ["4.C.2.d.1.h", "4.C.2.d.1.e"],  # bending or twisting; kneeling, crouching
    "phone": ["4.C.1.a.2.f"],
    "vehicle": ["4.C.2.a.1.f", "4.C.2.a.1.e"],
    "routine": ["4.C.3.b.7"],            # importance of repeating same tasks
    "heights": ["4.C.2.c.1.c"],          # exposed to high places
    "noise": ["4.C.2.b.1.a", "4.C.2.b.1.d"],  # distracting or uncomfortable noise; contaminants
}
# app key -> O*NET ability id, level scale (LV, 0 to 7), rescaled to 0..100
ABILITY = {
    "strength": "1.A.3.a.1",             # static strength: 4 = pull a 40-pound sack, 6 = lift 75-pound bags
}
LEVELS = os.path.join(os.path.dirname(__file__), "..", "data", "german-level.csv")
SCHEDULE = "4.C.3.d.4"                    # work schedules: share answering "irregular" (category 2)


def norm(s):
    return " ".join(str(s).lower().replace("’", "'").split())


def read_tsv(path):
    with open(path, encoding="utf-8") as f:
        yield from csv.DictReader(f, delimiter="\t")


def main(cw_path, onet_dir, en_path, out_path):
    en = json.load(open(en_path, encoding="utf-8"))
    esco_idx = {norm(l): i for i, l in enumerate(en["occ"])}
    n_esco = len(en["occ"])

    # crosswalk: skip the metadata block until the header row
    links = defaultdict(list)  # esco index -> [(onet code, weight, type)]
    unmatched_titles = set()
    with open(cw_path, encoding="utf-8-sig") as f:
        rows = list(csv.reader(f))
    head = next(i for i, r in enumerate(rows) if r and r[0].strip() == "O*NET Id")
    cols = rows[head]
    ci = {c: k for k, c in enumerate(cols)}
    for r in rows[head + 1:]:
        if len(r) < len(cols) or not r[0].strip():
            continue
        uri, title, typ = r[ci["ESCO or ISCO URI"]], r[ci["ESCO or ISCO Title"]], r[ci["Type of Match"]].strip()
        if "/occupation/" not in uri or typ not in WEIGHT:
            continue
        i = esco_idx.get(norm(title))
        if i is None:
            unmatched_titles.add(title)
            continue
        links[i].append((r[ci["O*NET Id"]].strip(), WEIGHT[typ], typ))

    # O*NET occupation data
    interests = defaultdict(dict)
    for r in read_tsv(os.path.join(onet_dir, "Career Interest Types.txt")):
        if r["Scale ID"] == "OI" and r["Element Name"] in RIASEC:
            interests[r["O*NET-SOC Code"]][r["Element Name"]] = float(r["Data Value"])
    zones = {r["O*NET-SOC Code"]: int(r["Job Zone"]) for r in read_tsv(os.path.join(onet_dir, "Job Zones.txt"))}
    ctx = defaultdict(dict)
    want = {e: k for k, ids in CONTEXT.items() for e in ids}
    for r in read_tsv(os.path.join(onet_dir, "Work Context.txt")):
        code, el, sc = r["O*NET-SOC Code"], r["Element ID"], r["Scale ID"]
        if sc == "CX" and el in want:
            v = (float(r["Data Value"]) - 1) / 4 * 100
            k = want[el]
            ctx[code][k] = max(ctx[code].get(k, 0), v)
        elif el == SCHEDULE and sc == "CTP" and r["Category"] == "2":
            ctx[code]["irregular"] = float(r["Data Value"])
    want = {e: k for k, e in ABILITY.items()}
    for r in read_tsv(os.path.join(onet_dir, "Abilities.txt")):
        if r["Scale ID"] == "LV" and r["Element ID"] in want:
            ctx[r["O*NET-SOC Code"]][want[r["Element ID"]]] = float(r["Data Value"]) / 7 * 100

    def data_for(code):
        """O*NET detail codes without data fall back to their .00 parent."""
        for c in (code, code[:8] + ".00"):
            if c in interests and len(interests[c]) == 6:
                return c
        return None

    out = {"v": "31.0", "r": [None] * n_esco, "z": [None] * n_esco, "q": [None] * n_esco,
           "c": {k: [None] * n_esco for k in list(CONTEXT) + ["irregular"] + list(ABILITY)}}
    for i, ls in links.items():
        use = [(data_for(c), w, t) for c, w, t in ls]
        use = [(c, w, t) for c, w, t in use if c]
        if not use:
            continue
        tw = sum(w for _, w, _ in use)
        out["r"][i] = [round(sum(interests[c][k] * w for c, w, _ in use) / tw * 10) for k in RIASEC]
        zs = [(zones[c], w) for c, w, _ in use if c in zones]
        if zs:
            out["z"][i] = max(1, min(4, round(sum(z * w for z, w in zs) / sum(w for _, w in zs)) - 1))
        out["q"][i] = 1 if any(t != "broadMatch" for _, _, t in use) else 0
        for k in out["c"]:
            vs = [(ctx[c][k], w) for c, w, _ in use if k in ctx[c]]
            if vs:
                out["c"][k][i] = round(sum(v * w for v, w in vs) / sum(w for _, w in vs))

    # German level, only where a cited rule states it (never borrowed or averaged)
    out["lv"] = {}
    with open(LEVELS, encoding="utf-8") as f:
        for row in csv.DictReader(f):
            i = esco_idx.get(norm(row["esco_occupation"]))
            if i is None:
                sys.exit(f"german-level.csv: no ESCO occupation {row['esco_occupation']!r}")
            if row["level"] not in ("A1", "A2", "B1", "B2", "C1", "C2") or not row["rule"] or not row["url"]:
                sys.exit(f"german-level.csv: {row['esco_occupation']!r} needs a CEFR level, a rule and a url")
            out["lv"][str(i)] = row["level"]

    # occupations without a crosswalk link borrow from the linked occupation that
    # shares the most essential skills (Jaccard 0.3 or more), marked as a rough match
    graph = json.load(open(os.path.join(os.path.dirname(en_path), "graph.json"), encoding="utf-8"))
    ess = [set(x) for x in graph["e"]]
    linked = [i for i in range(n_esco) if out["r"][i]]
    borrowed = 0
    for i in range(n_esco):
        if out["r"][i] or len(ess[i]) < 3:
            continue
        best, bj = None, 0.3
        for j in linked:
            inter = len(ess[i] & ess[j])
            if not inter:
                continue
            jac = inter / len(ess[i] | ess[j])
            if jac > bj:
                best, bj = j, jac
        if best is not None:
            out["r"][i], out["z"][i], out["q"][i] = out["r"][best], out["z"][best], 0
            for k in out["c"]:
                out["c"][k][i] = out["c"][k][best]
            borrowed += 1
    print(f"borrowed from the closest linked occupation: {borrowed}")

    have = sum(1 for x in out["r"] if x)
    print(f"ESCO occupations: {n_esco}")
    print(f"with crosswalk links: {len(links)}")
    print(f"with interest profile: {have} ({have / n_esco:.1%})")
    print(f"with preparation level: {sum(1 for x in out['z'] if x)}")
    print(f"exact, narrow or close link: {sum(1 for x in out['q'] if x == 1)}, broad only: {sum(1 for x in out['q'] if x == 0)}")
    print(f"crosswalk titles not found in ESCO v1.2.1 labels: {len(unmatched_titles)}")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(out, f, separators=(",", ":"))
    print(f"wrote {out_path}: {os.path.getsize(out_path)} bytes")


if __name__ == "__main__":
    if len(sys.argv) != 5:
        sys.exit(__doc__)
    main(*sys.argv[1:])
