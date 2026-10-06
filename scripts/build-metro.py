"""KoreaMetroGraph(MIT, https://github.com/ledyx/KoreaMetroGraph) 데이터에서
서울·경기·인천 지하철 데이터를 lib/data/metro.json 으로 만든다.

사용: python3 scripts/build-metro.py
"""
import json
from pathlib import Path

root = Path(__file__).resolve().parent
src = root / "source"
vertices = json.loads((src / "vertices_minimal.json").read_text())["DATA"]
edges = json.loads((src / "edges.json").read_text())

# 서울·경기·인천 밖(충남·강원) 역과 자기부상선은 제외
EXCLUDE_LINES = {"M"}
EXCLUDE_NAMES = {"강촌", "김유정", "남춘천", "춘천", "백양리", "굴봉산"}


def keep(v):
    return (
        v["line_num"] not in EXCLUDE_LINES
        and v["station_nm"] not in EXCLUDE_NAMES
        and v["xpoint_wgs"] >= 36.97
    )


coords = {}
kept = set()
for v in vertices:
    if keep(v):
        kept.add((v["line_num"], v["station_nm"]))
        coords.setdefault(v["station_nm"], []).append((v["xpoint_wgs"], v["ypoint_wgs"]))

stations = {
    n: [round(sum(c[0] for c in cs) / len(cs), 5), round(sum(c[1] for c in cs) / len(cs), 5)]
    for n, cs in sorted(coords.items())
}

lines = {}
for line, rows in edges.items():
    if line in EXCLUDE_LINES:
        continue
    out = []
    for r in rows:
        if (line, r["from"]) in kept and (line, r["to"]) in kept:
            out.append([r["from"], r["to"], max(1, int(r["time"]))])
    if out:
        lines[line] = out


# 원본 edges.json에는 노선 중간 연결 구간이 일부 빠져 있다(예: 1호선이 3조각).
# 끊긴 조각은 가장 가까운 역끼리 이어 한 노선으로 만든다.
def km(a, b):
    from math import asin, cos, radians, sin, sqrt

    dl, dg = radians(b[0] - a[0]), radians(b[1] - a[1])
    h = sin(dl / 2) ** 2 + cos(radians(a[0])) * cos(radians(b[0])) * sin(dg / 2) ** 2
    return 12742 * asin(sqrt(h))


line_stations = {}
for v in vertices:
    if keep(v):
        line_stations.setdefault(v["line_num"], set()).add(v["station_nm"])

patched = []
for line in list(line_stations):
    es = lines.setdefault(line, [])
    names = line_stations[line]
    while True:
        parent = {n: n for n in names}

        def find(x):
            while parent[x] != x:
                parent[x] = parent[parent[x]]
                x = parent[x]
            return x

        for a, b, _ in es:
            parent[find(a)] = find(b)
        groups = {}
        for n in names:
            groups.setdefault(find(n), []).append(n)
        if len(groups) <= 1:
            break
        # 가장 큰 조각과, 그 조각에 가장 가까운 다른 조각의 역 쌍을 잇는다
        main = max(groups.values(), key=len)
        best = None
        for g in groups.values():
            if g is main:
                continue
            for a in main:
                for b in g:
                    d = km(stations[a], stations[b])
                    if best is None or d < best[0]:
                        best = (d, a, b)
        d, a, b = best
        es.append([a, b, max(2, round(d / 0.6))])
        patched.append((line, a, b, round(d, 1)))
print("patched", patched)

# 원본에서 빠진 순환선 구간 (2호선 대림–신도림)
for line, a, b, minutes in [("2", "대림", "신도림", 2)]:
    if (line, a) in kept and (line, b) in kept and not any(
        {x, y} == {a, b} for x, y, _ in lines[line]
    ):
        lines[line].append([a, b, minutes])

(root.parent / "lib" / "data" / "metro.json").write_text(
    json.dumps({"stations": stations, "lines": lines}, ensure_ascii=False, separators=(",", ":"))
)
print(len(stations), "stations", {k: len(v) for k, v in lines.items()})
