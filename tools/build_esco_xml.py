#!/usr/bin/env python3
"""Build the ESCO browser files from the official ESCO XML download.

Usage:
  python3 tools/build_esco_xml.py path/to/esco-v1.2.1.xml [lang ...]

The XML download (all languages in one file) is the same data as the CSV
sets. Languages default to "en de". Writes public/esco/graph.json and
public/esco/<lang>.json in the format esco.js expects (see build_esco.py).
"""
import json, os, re, sys
import xml.etree.ElementTree as ET

OUT = os.path.join(os.path.dirname(__file__), "..", "public", "esco")
M = "{http://data.europa.eu/esco/model#}"
SKOS = "{http://www.w3.org/2004/02/skos/core#}"
LEVEL1 = re.compile(r"^(S\d|T\d|L\d)$")
ISCED2 = re.compile(r"/isced-f/\d\d$")


def main():
    src = sys.argv[1]
    langs = sys.argv[2:] or ["en", "de"]
    nodes, assoc = {}, []
    depth = 0
    for ev, el in ET.iterparse(src, events=("start", "end")):
        if ev == "start":
            depth += 1
            continue
        depth -= 1
        if depth != 2:
            continue
        tag = el.tag.replace(M, "")
        if tag in ("skill", "occupation", "concept"):
            n = {"kind": tag, "pref": {}, "alt": {}, "bt": [], "type": None, "notation": None, "status": None, "rel": []}
            for c in el:
                t = c.tag.replace(M, "").replace(SKOS, "")
                lang = c.get("language")
                if t == "prefLabel" and lang in langs and c.text:
                    n["pref"][lang] = c.text.strip()
                elif t == "altLabel" and lang in langs and c.text:
                    n["alt"].setdefault(lang, []).append(c.text.strip())
                elif t == "broaderTransitive" or t == "broader":
                    n["bt"].append(c.get("uriref"))
                elif t == "skillType":
                    n["type"] = c.get("uri")
                elif t == "notation" and c.text:
                    n["notation"] = c.text.strip()
                elif t == "status" and c.text:
                    n["status"] = c.text.strip()
                elif t in ("relatedEssentialSkill", "relatedOptionalSkill"):
                    n["rel"].append(("o2s", t, c.get("uriref")))
                elif t in ("isEssentialSkillFor", "isOptionalSkillFor"):
                    n["rel"].append(("s2o", t, c.get("uriref")))
            nodes[el.get("uri")] = n
        elif tag == "associationObject":
            a = {}
            for c in el:
                t = c.tag.replace(M, "")
                if t == "isAssociationFor":
                    a["from"] = c.get("uriref")
                elif t == "target":
                    a["to"] = c.get("uriref")
                elif t == "type":
                    a["type"] = c.get("uri", "")
            assoc.append(a)
        el.clear()

    def released(n):
        return n["status"] in (None, "released")

    occ = sorted(u for u, n in nodes.items() if n["kind"] == "occupation" and released(n) and n["pref"].get("en"))
    sk = sorted(u for u, n in nodes.items() if n["kind"] == "skill" and n["type"] and released(n) and n["pref"].get("en"))
    level1 = sorted(u for u, n in nodes.items()
                    if (n["notation"] and LEVEL1.match(n["notation"])) or ISCED2.search(u))
    l1set = set(level1)
    gi = {u: i for i, u in enumerate(level1)}
    oi = {u: i for i, u in enumerate(occ)}
    si = {u: i for i, u in enumerate(sk)}

    # walk broader links up to a level 1 group
    memo = {}

    def group(u, seen=frozenset()):
        if u in l1set:
            return u
        if u in memo:
            return memo[u]
        res = None
        for b in nodes.get(u, {}).get("bt", []):
            if b in l1set:
                res = b
                break
        if not res:
            for b in nodes.get(u, {}).get("bt", []):
                if b in seen:
                    continue
                res = group(b, seen | {u})
                if res:
                    break
        memo[u] = res
        return res

    canon = {}
    for u in level1:
        canon.setdefault(nodes[u]["pref"].get("en", u).lower(), gi[u])
    g = [canon[nodes[group(u)]["pref"].get("en", group(u)).lower()] if group(u) else -1 for u in sk]
    k = [1 if nodes[u]["type"].endswith("/knowledge") else 0 for u in sk]
    ess = [[] for _ in occ]
    opt = [[] for _ in occ]
    # occupation to skill links appear in three places in the XML; use all of them
    links = []
    for a in assoc:
        t = a.get("type", "")
        links.append((a.get("from"), a.get("to"), "e" if t.endswith("essential-skill") else "o" if t.endswith("optional-skill") else None))
    for u, n in nodes.items():
        for d, t, other in n["rel"]:
            kind = "e" if "Essential" in t else "o"
            links.append((u, other, kind) if d == "o2s" else (other, u, kind))
    for frm, to, kind in links:
        o, s = oi.get(frm), si.get(to)
        if o is None or s is None or not kind:
            continue
        (ess if kind == "e" else opt)[o].append(s)
    for i in range(len(occ)):
        ess[i] = sorted(set(ess[i]))
        opt[i] = sorted(set(opt[i]) - set(ess[i]))

    os.makedirs(OUT, exist_ok=True)
    with open(os.path.join(OUT, "graph.json"), "w", encoding="utf-8") as fh:
        json.dump({"v": "1.2.1", "e": ess, "o": opt, "g": g, "k": k}, fh, separators=(",", ":"))
    print(f"graph: {len(occ)} occupations, {len(sk)} skills, {len(level1)} groups, "
          f"{sum(map(len, ess))} essential and {sum(map(len, opt))} optional links, "
          f"{sum(1 for x in g if x < 0)} skills without group")
    for lang in langs:
        def lab(u):
            p = nodes[u]["pref"]
            return p.get(lang) or p.get("en", "")
        lab_out = {
            "lang": lang,
            "occ": [lab(u) for u in occ],
            "alt": ["\n".join(nodes[u]["alt"].get(lang, [])[:12]) for u in occ],
            "sk": [lab(u) for u in sk],
            "groups": [lab(u) for u in level1],
        }
        missing = sum(1 for u in sk if lang not in nodes[u]["pref"])
        with open(os.path.join(OUT, f"{lang}.json"), "w", encoding="utf-8") as fh:
            json.dump(lab_out, fh, ensure_ascii=False, separators=(",", ":"))
        print(f"{lang}: {missing} skills without a {lang} label (English used)")


if __name__ == "__main__":
    main()
