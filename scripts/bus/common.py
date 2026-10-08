"""버스 데이터 수집 스크립트 공통 코드. .env.local의 키를 읽고, 응답을 .cache/bus 에 저장해 이어받기를 지원한다."""
import json
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CACHE = ROOT / ".cache" / "bus"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0 Safari/537.36"


def env(name: str) -> str:
    for line in (ROOT / ".env.local").read_text().splitlines():
        if line.startswith(name + "="):
            return line.split("=", 1)[1].strip()
    raise SystemExit(f"{name} 가 .env.local 에 없습니다")


def get_json(url: str, retries: int = 3, timeout: int = 30):
    last = None
    for i in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            return json.load(urllib.request.urlopen(req, timeout=timeout))
        except urllib.error.HTTPError as e:
            # 오류 응답에도 JSON 본문(호출 한도 등)이 오므로 호출한 쪽이 판단하게 돌려준다.
            try:
                return json.load(e)
            except (json.JSONDecodeError, ValueError):
                last = e
                time.sleep(1.5 * (i + 1))
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as e:
            last = e
            time.sleep(1.5 * (i + 1))
    raise last


def cached_map(name: str, keys, fetch, workers: int = 6):
    """keys 각각에 대해 fetch(key)를 실행하고 CACHE/name/{key}.json 에 저장한다. 이미 있으면 건너뛴다."""
    d = CACHE / name
    d.mkdir(parents=True, exist_ok=True)
    todo = [k for k in keys if not (d / f"{k}.json").exists()]
    print(f"[{name}] 전체 {len(keys)}건 중 새로 받을 것 {len(todo)}건", flush=True)
    done = 0
    stop = False

    def work(k):
        nonlocal done, stop
        if stop:
            return
        try:
            data = fetch(k)
        except Exception as e:  # noqa: BLE001
            print(f"  실패 {k}: {e}", flush=True)
            return
        if data == "QUOTA":
            stop = True
            print("  호출 한도에 도달해 중단합니다. 내일 다시 실행하면 이어서 받습니다.", flush=True)
            return
        (d / f"{k}.json").write_text(json.dumps(data, ensure_ascii=False))
        done += 1
        if done % 200 == 0:
            print(f"  {done}/{len(todo)}", flush=True)

    with ThreadPoolExecutor(workers) as ex:
        list(ex.map(work, todo))
    print(f"[{name}] 완료 {done}건", flush=True)
