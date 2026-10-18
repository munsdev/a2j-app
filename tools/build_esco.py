#!/usr/bin/env python3
"""Build the compact ESCO files the browser loads.

Usage:
  python3 tools/build_esco.py path/to/esco_csv_dir [more dirs ...]

Each directory is one language of the official ESCO CSV download
(occupations_xx.csv, skills_xx.csv, occupationSkillRelations_xx.csv,
broaderRelationsSkillPillar_xx.csv, skillsHierarchy_xx.csv). The language
code is read from the file names.

Writes:
  public/esco/graph.json   occupations -> essential and optional skills,
                           skill -> group, skill -> knowledge or skill.
                           Built from the first directory; it is the same in
                           every language.
  public/esco/<lang>.json  labels for occupations, skills and groups.

Indexes are positions in the list of URIs sorted alphabetically, so they
match across languages.
"""
import csv, glob, json, os, re, sys

csv.field_size_limit(10**9)
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "esco")


def lang_of(d):
    f = glob.glob(os.path.join(d, "occupations_*.csv"))
    if not f:
        sys.exit(f"No occupations_xx.csv in {d}")
    return re.search(r"occupations_(\w+)\.csv$", f[0]).group(1)


def rows(d, name, lang):
    with open(os.path.join(d, f"{name}_{lang}.csv"), encoding="utf-8") as fh:
        return list(csv.DictReader(fh))


def build_graph(d, lang):
    occ = sorted(r["conceptUri"] for r in rows(d, "occupations", lang))
    skills = rows(d, "skills", lang)
    sk = sorted(r["conceptUri"] for r in skills)
    oi = {u: i for i, u in enumerate(occ)}
    si = {u: i for i, u in enumerate(sk)}

    # skill group: the level 1 group of the ESCO skills pillar (S1..S8, T1..T6, K fields, L1..L2)
    hier = rows(d, "skillsHierarchy", lang)
    level1 = {}
    for r in hier:
        if r["Level 1 URI"]:
            for lv in ("1", "2", "3"):
                u = r.get(f"Level {lv} URI")
                if u:
                    level1[u] = r["Level 1 URI"]
    groups = sorted(set(level1.values()))
    gi = {u: i for i, u in enumerate(groups)}
    broader = {}
    for r in rows(d, "broaderRelationsSkillPillar", lang):
        broader.setdefault(r["conceptUri"], []).append(r["broaderUri"])

    memo = {}

    def find(u, seen=()):
        if u in level1:
            return level1[u]
        if u in memo:
            return memo[u]
        res = None
        for b in broader.get(u, []):
            if b in seen:
                continue
            res = find(b, seen + (u,))
            if res:
                break
        memo[u] = res
        return res

    skill_group = []
    for u in sk:
        g = find(u)
        skill_group.append(gi[g] if g else -1)
    kind = {r["conceptUri"]: (1 if r["skillType"] == "knowledge" else 0) for r in skills}
    skill_kind = [kind.get(u, 0) for u in sk]

    ess = [[] for _ in occ]
    opt = [[] for _ in occ]
    for r in rows(d, "occupationSkillRelations", lang):
        o, s = oi.get(r["occupationUri"]), si.get(r["skillUri"])
        if o is None or s is None:
            continue
        (ess if r["relationType"] == "essential" else opt)[o].append(s)
    return {"occ": occ, "sk": sk, "groups": groups}, {
        "v": 1,
        "e": ess,
        "o": opt,
        "g": skill_group,
        "k": skill_kind,
    }


def build_labels(d, lang, ids):
    occ = {r["conceptUri"]: r for r in rows(d, "occupations", lang)}
    sk = {r["conceptUri"]: r for r in rows(d, "skills", lang)}
    glab = {}
    for r in rows(d, "skillsHierarchy", lang):
        if r["Level 1 URI"]:
            glab[r["Level 1 URI"]] = r["Level 1 preferred term"]

    def alts(r):
        a = [x.strip() for x in (r.get("altLabels") or "").split("\n") if x.strip()]
        return "\n".join(a[:12])

    return {
        "lang": lang,
        "occ": [occ[u]["preferredLabel"] if u in occ else "" for u in ids["occ"]],
        "alt": [alts(occ[u]) if u in occ else "" for u in ids["occ"]],
        "sk": [sk[u]["preferredLabel"] if u in sk else "" for u in ids["sk"]],
        "groups": [glab.get(u, "") for u in ids["groups"]],
    }


def main():
    dirs = sys.argv[1:]
    if not dirs:
        sys.exit(__doc__)
    os.makedirs(OUT, exist_ok=True)
    first = dirs[0]
    ids, graph = build_graph(first, lang_of(first))
    with open(os.path.join(OUT, "graph.json"), "w", encoding="utf-8") as fh:
        json.dump(graph, fh, separators=(",", ":"))
    for d in dirs:
        lang = lang_of(d)
        lab = build_labels(d, lang, ids)
        with open(os.path.join(OUT, f"{lang}.json"), "w", encoding="utf-8") as fh:
            json.dump(lab, fh, ensure_ascii=False, separators=(",", ":"))
        print(f"{lang}: {len(lab['occ'])} occupations, {len(lab['sk'])} skills, {len(lab['groups'])} groups")


if __name__ == "__main__":
    main()
