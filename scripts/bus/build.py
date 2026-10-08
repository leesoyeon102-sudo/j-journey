"""수집한 서울·경기 버스 데이터를 앱에서 쓰는 하나의 형식(lib/data/bus.json)으로 합친다.

서울 노선(경기 노선 포함)은 서울 API의 정류장 목록·구간 속도를, 경기 전용 노선은 경기데이터드림의
노선 경유정류소·누적 거리를 쓴다. 배차 간격은 서울은 `term`, 경기는 경기도_버스노선 조회의 첨두/비첨두 값이다.
정류장 id는 서울·경기가 같은 id 체계를 공유하므로 그대로 쓴다.

사용: python3 scripts/bus/build.py
"""
import glob
import json
from collections import defaultdict
from pathlib import Path

from common import CACHE, ROOT

OUT = ROOT / "lib" / "data" / "bus.json"

SEOUL_KIND = {"1": "공항", "2": "마을", "3": "간선", "4": "지선", "5": "순환", "6": "광역", "7": "인천", "8": "경기", "0": "공용"}
# 종류별 평균 주행 속도(km/h). 서울 구간 속도 값이 없을 때와 경기 노선에 쓴다.
SPEED = {"마을": 14, "지선": 16, "간선": 18, "순환": 15, "공항": 30, "광역": 28, "직행좌석": 30, "광역급행": 40, "시외": 32, "일반": 18, "경기": 20, "인천": 20, "공용": 18}
DWELL = 20  # 정류장 정차(초)


def hhmm(s):
    """'20261008043000' → '0430'"""
    s = (s or "").strip()
    return s[8:12] if len(s) >= 12 else ""


def load(pattern):
    for f in sorted(glob.glob(str(CACHE / pattern))):
        yield Path(f).stem, json.load(open(f))


def kind_of_gg(type_name):
    n = type_name or ""
    if "마을" in n:
        return "마을"
    if "광역급행" in n:
        return "광역급행"
    if "직행좌석" in n or "좌석" in n:
        return "직행좌석"
    if "시외" in n:
        return "시외"
    if "공항" in n:
        return "공항"
    return "일반"


def main():
    stops = []  # [id, name, lat5, lng5, ars]
    stop_idx = {}

    def stop(sid, name, lat, lng, ars=""):
        if sid not in stop_idx:
            stop_idx[sid] = len(stops)
            stops.append([sid, name, round(lat * 1e5), round(lng * 1e5), ars])
        elif ars and not stops[stop_idx[sid]][4]:
            stops[stop_idx[sid]][4] = ars
        return stop_idx[sid]

    routes = []
    seen = set()

    gg_info = {k: v for k, v in load("gg_info/*.json")}

    # 1) 서울 API: 서울 노선 + 서울을 지나는 경기 노선 (정류장 전체 경로)
    seoul_routes = {r["busRouteId"]: r for r in json.load(open(CACHE / "seoul_routes.json"))}
    for rid, rows in load("seoul_stops/*.json"):
        meta = seoul_routes.get(rid)
        if not meta or not rows:
            continue
        rows = sorted(rows, key=lambda r: int(r["seq"]))
        info = gg_info.get(rid)
        has_info = info and not info.get("none")
        kind = SEOUL_KIND.get(meta["routeType"], "공용")
        if meta["routeType"] == "8" and has_info:
            kind = kind_of_gg(info.get("routeTypeName"))
        term = int(meta["term"]) if str(meta.get("term", "")).strip().isdigit() else 0
        h = [term] * 6
        first, last = hhmm(meta.get("firstBusTm")), hhmm(meta.get("lastBusTm"))
        if has_info:
            h = [info.get("peekAlloc") or term, info.get("nPeekAlloc") or term,
                 info.get("satPeekAlloc") or term, info.get("satNPeekAlloc") or term,
                 info.get("sunPeekAlloc") or term, info.get("sunNPeekAlloc") or term]
            first = (info.get("upFirstTime") or "").replace(":", "") or first
            last = (info.get("upLastTime") or "").replace(":", "") or last
        idxs, secs, orders = [], [], []
        t = 0.0
        for k, r in enumerate(rows):
            try:
                lat, lng = float(r["gpsY"]), float(r["gpsX"])
            except ValueError:
                continue
            ars = r.get("arsId", "")
            ars = "" if ars in ("0", "00000") else ars
            if idxs:
                dist = float(r.get("fullSectDist") or 0)
                spd = float(r.get("sectSpd") or 0)
                if spd <= 0:
                    spd = SPEED.get(kind, 18)
                spd = min(max(spd, 5), 60)
                t += dist / (spd / 3.6) + DWELL
            idxs.append(stop(r["station"], r["stationNm"], lat, lng, ars))
            secs.append(round(t))
            orders.append(int(r["seq"]))
        if len(idxs) < 2:
            continue
        routes.append({"id": rid, "n": meta["busRouteNm"], "k": kind, "r": "S", "h": h, "f": first, "l": last, "s": idxs, "m": secs, "o": orders})
        seen.add(rid)

    # 2) 경기 전용 노선: 경기데이터드림 경유정류소 + 노선 정보
    gg_stop = {}
    for _, rows in load("gg_BusStation/*.json"):
        for r in rows:
            if r.get("WGS84_LAT") and r.get("WGS84_LOGT"):
                gg_stop[r["STATION_ID"]] = (r["STATION_NM_INFO"], float(r["WGS84_LAT"]), float(r["WGS84_LOGT"]))
    route_rows = defaultdict(list)
    for _, rows in load("gg_TBBMSROUTESTATIONM/*.json"):
        for r in rows:
            route_rows[r["ROUTE_ID"]].append(r)
    gg_names = {r["ROUTE_ID"]: r["ROUTE_NM"] for r in json.load(open(CACHE / "gg_routes.json"))}
    for rid, rows in route_rows.items():
        if rid in seen:
            continue
        info = gg_info.get(rid)
        if not info or info.get("none"):
            continue  # 운행 정보가 없는 노선은 쓰지 않는다
        kind = kind_of_gg(info.get("routeTypeName"))
        rows.sort(key=lambda r: r["STTN_ORDR"])
        peek, off = info.get("peekAlloc") or 0, info.get("nPeekAlloc") or 0
        h = [peek, off, info.get("satPeekAlloc") or peek, info.get("satNPeekAlloc") or off,
             info.get("sunPeekAlloc") or peek, info.get("sunNPeekAlloc") or off]
        spd = SPEED.get(kind, 20)
        idxs, secs, orders = [], [], []
        prev_acc = None
        t = 0.0
        for r in rows:
            sid = r["STTN_ID"]
            acc = r.get("ACCMLT_DSTN")
            if sid not in gg_stop or acc is None:
                continue
            name, lat, lng = gg_stop[sid]
            if prev_acc is not None:
                t += max(0.0, acc - prev_acc) / (spd / 3.6) + DWELL
            prev_acc = acc
            idxs.append(stop(sid, name, lat, lng))
            secs.append(round(t))
            orders.append(r["STTN_ORDR"])
        if len(idxs) < 2:
            continue
        routes.append({"id": rid, "n": str(info.get("routeName") or gg_names.get(rid, rid)), "k": kind, "r": "G", "h": h,
                       "f": (info.get("upFirstTime") or "").replace(":", ""), "l": (info.get("upLastTime") or "").replace(":", ""),
                       "s": idxs, "m": secs, "o": orders})

    OUT.write_text(json.dumps({"v": 1, "stops": stops, "routes": routes}, ensure_ascii=False, separators=(",", ":")))
    sz = OUT.stat().st_size / 1e6
    print(f"정류장 {len(stops)}개, 노선 {len(routes)}개 (서울 {sum(r['r']=='S' for r in routes)}, 경기 전용 {sum(r['r']=='G' for r in routes)}), 파일 {sz:.1f}MB")


if __name__ == "__main__":
    main()
