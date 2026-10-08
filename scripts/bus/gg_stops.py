"""경기도 정류소·노선 경유정류소 전체 (경기데이터드림 Open API, 호출 제한 없음)."""
import json
from common import CACHE, env, get_json, cached_map

KEY = env("GG_DATA_KEY")


def pages(service, size=1000):
    d = get_json(f"https://openapi.gg.go.kr/{service}?KEY={KEY}&Type=json&pIndex=1&pSize={size}")
    total = d[service][0]["head"][0]["list_total_count"]
    return list(range(1, (total + size - 1) // size + 1))


def make_fetch(service):
    def fetch(p):
        d = get_json(f"https://openapi.gg.go.kr/{service}?KEY={KEY}&Type=json&pIndex={p}&pSize=1000", retries=4)
        if service not in d:
            raise RuntimeError(json.dumps(d, ensure_ascii=False)[:100])
        return d[service][1]["row"]

    return fetch


if __name__ == "__main__":
    for svc in ("BusStation", "TBBMSROUTESTATIONM"):
        cached_map(f"gg_{svc}", pages(svc), make_fetch(svc), workers=4)
