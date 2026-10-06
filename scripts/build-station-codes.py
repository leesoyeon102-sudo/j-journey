"""서울 열린데이터광장 역 목록(SearchSTNBySubwayLineInfo)으로
우리 역 데이터(lib/data/metro.json)의 1~9호선 역을 서울교통공사 역코드에 연결한다.

사용: python3 scripts/build-station-codes.py   (.env.local의 SEOUL_SUBWAY_KEY 필요)
결과: lib/data/stationcodes.json  { "2:강남": "0222", ... }
"""
import json
import re
import urllib.request
from pathlib import Path

root = Path(__file__).resolve().parent.parent
key = next(
    line.split("=", 1)[1].strip()
    for line in (root / ".env.local").read_text().splitlines()
    if line.startswith("SEOUL_SUBWAY_KEY=")
)

url = f"http://openapi.seoul.go.kr:8088/{key}/json/SearchSTNBySubwayLineInfo/1/1000/"
rows = json.load(urllib.request.urlopen(url, timeout=30))["SearchSTNBySubwayLineInfo"]["row"]

api = {}
for r in rows:
    m = re.match(r"0(\d)호선", r["LINE_NUM"])
    if m:
        api.setdefault(m.group(1), {})[r["STATION_NM"]] = r["STATION_CD"]

# 우리 데이터의 역 이름이 서울교통공사 표기와 다른 경우
ALIAS = {
    ("1", "서울"): "서울역",
    ("4", "서울"): "서울역",
    ("1", "지제"): "평택지제",
    ("7", "총신대입구(이수)"): "이수",
}

metro = json.loads((root / "lib" / "data" / "metro.json").read_text())
codes, missing = {}, []
for line in "123456789":
    names = {n for e in metro["lines"].get(line, []) for n in e[:2]}
    for n in sorted(names):
        cand = [ALIAS.get((line, n)), n, re.sub(r"\(.*?\)", "", n)]
        code = next((api[line][c] for c in cand if c and c in api.get(line, {})), None)
        if code:
            codes[f"{line}:{n}"] = code
        else:
            missing.append(f"{line}:{n}")

(root / "lib" / "data" / "stationcodes.json").write_text(
    json.dumps(codes, ensure_ascii=False, separators=(",", ":"))
)
print(len(codes), "매칭, 미매칭:", missing)
