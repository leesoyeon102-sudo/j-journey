"""서울 버스 노선(경기 노선 포함) 목록과 노선별 경유 정류소 (공공데이터포털 서울특별시_노선정보조회)."""
import json
import time
from common import CACHE, env, get_json, cached_map

KEY = env("DATA_GO_KR_KEY")
BASE = "http://ws.bus.go.kr/api/rest/busRouteInfo"


def route_list():
    d = get_json(f"{BASE}/getBusRouteList?serviceKey={KEY}&strSrch=&resultType=json")
    items = d["msgBody"]["itemList"]
    (CACHE).mkdir(parents=True, exist_ok=True)
    (CACHE / "seoul_routes.json").write_text(json.dumps(items, ensure_ascii=False))
    return items


def fetch(route_id):
    url = f"{BASE}/getStaionByRoute?serviceKey={KEY}&busRouteId={route_id}&resultType=json"
    for attempt in range(6):
        time.sleep(0.25)
        try:
            d = get_json(url, retries=1)
        except Exception:
            time.sleep(2 + attempt)
            continue
        h = d.get("msgHeader", {})
        if h.get("headerCd") == "0":
            return d["msgBody"]["itemList"]
        msg = json.dumps(d, ensure_ascii=False)
        if "LIMIT" in msg.upper() or "초과" in msg:
            return "QUOTA"
        time.sleep(1 + attempt)
    raise RuntimeError("재시도 초과")


if __name__ == "__main__":
    items = route_list()
    ids = [r["busRouteId"] for r in items if r["routeType"] != "9"]
    cached_map("seoul_stops", ids, fetch, workers=3)
