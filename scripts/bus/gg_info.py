"""경기도 버스 노선별 배차 간격·첫차·막차 (공공데이터포털 경기도_버스노선 조회)."""
import json
import time
from common import CACHE, env, get_json, cached_map, UA

import urllib.request

DATA_KEY = env("DATA_GO_KR_KEY")
GG_KEY = env("GG_DATA_KEY")


def routes():
    out = []
    p = 1
    while True:
        d = get_json(f"https://openapi.gg.go.kr/TBBMSROUTEM?KEY={GG_KEY}&Type=json&pIndex={p}&pSize=1000")
        rows = d["TBBMSROUTEM"][1]["row"]
        out += rows
        if len(out) >= d["TBBMSROUTEM"][0]["head"][0]["list_total_count"]:
            return out
        p += 1


def fetch(route_id):
    url = f"https://apis.data.go.kr/6410000/busrouteservice/v2/getBusRouteInfoItemv2?serviceKey={DATA_KEY}&routeId={route_id}&format=json"
    for attempt in range(8):
        time.sleep(0.7)
        try:
            d = get_json(url, retries=1)
        except Exception:  # 429 등: 잠시 쉬었다가 다시
            time.sleep(2 + attempt)
            continue
        if "OpenAPI_ServiceResponse" in d:
            code = d["OpenAPI_ServiceResponse"]["cmmMsgHeader"].get("returnReasonCode")
            if code == "23":  # 초당 요청 제한: 쉬었다 재시도
                time.sleep(2 + attempt)
                continue
            if code == "22":  # 일일 요청 제한
                return "QUOTA"
            raise RuntimeError(json.dumps(d, ensure_ascii=False)[:120])
        h = d["response"]["msgHeader"]
        if h.get("resultCode") == 4:
            return {"none": True}
        return d["response"]["msgBody"]["busRouteInfoItem"]
    raise RuntimeError("재시도 초과")


if __name__ == "__main__":
    rs = routes()
    (CACHE).mkdir(parents=True, exist_ok=True)
    (CACHE / "gg_routes.json").write_text(json.dumps(rs, ensure_ascii=False))
    cached_map("gg_info", [r["ROUTE_ID"] for r in rs], fetch, workers=1)
