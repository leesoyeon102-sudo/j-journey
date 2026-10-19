"use client";

import Link from "next/link";
import { SettingsIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import AlertPanel from "@/components/AlertPanel";
import { memo, useEffect, useRef, useState, useSyncExternalStore } from "react";
import * as amplitude from "@amplitude/analytics-browser";
import Header from "./Header";
import LocationPicker from "./LocationPicker";
import PlanFilter, { type PlanTab } from "./PlanFilter";
import PlanSlider from "./PlanSlider";
import SkyBackdrop from "./SkyBackdrop";
import ThemeColor from "./ThemeColor";
import RouteCard from "./RouteCard";
import Timeline from "./Timeline";
import TripActionButton from "./TripActionButton";
import TripMenu from "./TripMenu";
import TripProgressCard from "./TripProgressCard";
import { requestPlans } from "@/lib/api";
import { cancelArrivalReminder, scheduleArrivalReminder } from "@/lib/pushReminder";
import { dateString } from "@/lib/dates";
import { hasAskedFeedback, notifyArrived } from "@/lib/feedback";
import { GO_HOME_EVENT, requestLeave, setLeaveGuard } from "@/lib/leaveGuard";
import { readCurrentPlace } from "@/lib/currentLocation";
import { draft, isOriginLocked, unlockOrigin } from "@/lib/draft";
import type { Place } from "@/lib/places";
import {
  addTrip,
  recordArrival,
  recordDeparture,
  removeTrip,
  cancelDeparture,
  saveHome,
  saveLastDestination,
  clearLastDestination,
  saveLastOrigin,
  useHome,
  useLastDestination,
  useLastOrigin,
  useTrips,
} from "@/lib/storage";
import { groupPlans } from "@/lib/planGroups";
import type { Plan, PlanGroups, Trip } from "@/lib/types";
import { fmt, parseTime } from "@/lib/time";

interface Form {
  origin: Place | null;
  destination: Place | null;
  time: string;
  /** 기본은 오늘, 내일 약속이면 토글을 켠다 */
  tomorrow: boolean;
}

/** 약속 시각보다 이만큼 일찍 도착하도록 계산한다. (유저 설정 없음) */
const ARRIVE_EARLY_MIN = 5;

/** 지금 시각 "HH:MM" */
const nowHHMM = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

const DEFAULTS: Form = { origin: null, destination: null, time: "14:00", tomorrow: false };

/** 직접 고른 출발지를 지운 입력값 */
const withoutOrigin = (e: Partial<Form>) => {
  const next = { ...e };
  delete next.origin;
  return next;
};

export default function Planner() {
  const router = useRouter();
  const trips = useTrips();
  const home = useHome();
  const savedOrigin = useLastOrigin();
  const savedDestination = useLastDestination();

  const [edit, setEdit] = useState<Partial<Form>>(() => ({ ...draft }));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  // 계산된 안들: 추천(하나), 지하철 우선·버스 우선(각각 여러 안). 지금 고른 칩과, 그 칩에서 보고 있는 안.
  const [groups, setGroups] = useState<PlanGroups | null>(null);
  const [tab, setTab] = useState<PlanTab>("recommended");
  const [page, setPage] = useState(0);
  // 도착·늦음 버튼을 누른 뒤 띄우는 얼럿. 확인을 누르면 로드맵으로 간다.
  const [arrivedAlert, setArrivedAlert] = useState(false);
  // "출발할게요"를 누른 직후 띄우는 안내. 도착 예정까지 남은 분과 알림 허용을 부탁한다. 안 띄울 땐 null.
  const [departedAlert, setDepartedAlert] = useState<number | null>(null);
  // 도착 이벤트를 이미 보낸 안내. 버튼을 빠르게 두 번 눌러도 한 번만 보낸다.
  const arrivalTracked = useRef<string | null>(null);
  // 도착 푸시를 눌러 연 안내의 id. 도착 기록의 진입 경로(source)를 가린다. pushTracked: 푸시 진입 이벤트를 이미 보냈는지.
  const openedFromPush = useRef<string | null>(null);
  // "놓쳤어요"로 경로를 다시 찾는 중인지와, 못 찾았을 때의 이유
  const [missing, setMissing] = useState(false);
  // "놓쳤어요"를 잘못 누르지 않도록 먼저 묻는 확인 얼럿
  const [missedConfirm, setMissedConfirm] = useState(false);
  const [missedError, setMissedError] = useState<string | null>(null);
  const pushTracked = useRef(false);
  const [editing, setEditing] = useState(false);
  // 장소 고르는 화면. 집 주소가 없으면 앱을 시작할 때 먼저 받는다. (등록 전에는 닫을 수 없음)
  const [picker, setPicker] = useState<"origin" | "destination" | null>(null);
  const needHome = home === null;
  const showHomePicker = needHome;
  const leaveHomePicker = () => setPicker(null);

  /** 출발지·도착지 선택 화면의 주소 입력 아래에 놓는 집 칩 */
  const homeChip = (apply: (place: Place) => void) =>
    home ? { address: home.area, onPick: () => apply(home) } : undefined;

  // 약속 시각은 직접 고르기 전까지 지금 시각이다. (서버에서 그린 화면과 어긋나지 않도록 서버 값은 따로 둔다)
  const nowTime = useSyncExternalStore(
    () => () => {},
    nowHHMM,
    () => DEFAULTS.time,
  );
  // 입력 초기값: 출발지는 현재 위치로 자동 입력되고(아래 effect), 약속 시각은 지금 시각이다.
  // 도착지는 마지막으로 고른 곳을 그대로 유지한다.
  const form: Form = {
    ...DEFAULTS,
    time: nowTime,
    ...(savedOrigin ? { origin: savedOrigin } : {}),
    ...(savedDestination ? { destination: savedDestination } : {}),
    ...edit,
  };
  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    if (k === "time" || k === "tomorrow") Object.assign(draft, { [k]: v });
    setEdit((e) => ({ ...e, [k]: v }));
  };

  // 버튼을 눌러 계산한 결과만 보여준다. 다른 탭에 다녀오면 입력 화면부터 시작한다.
  const current = editing || !activeId ? undefined : trips.find((t) => t.id === activeId);

  // 출발했어요를 누르고 아직 도착을 기록하지 않은 안내. 있으면 홈에는 검색 대신 이동 중 카드를 보여준다.
  const moving = trips.find((t) => t.departedAt && t.status === "planned");
  // 홈 제목줄 오른쪽 설정 아이콘(집 주소 변경, 알림). 이동 중 홈에도 똑같이 보인다.
  const settingsLink = (
    <Link
      href="/settings"
      aria-label="설정"
      className="-mr-2 flex size-10 items-center justify-center rounded-pill text-on-sky transition-colors active:bg-glass"
    >
      <SettingsIcon className="size-6" strokeWidth={1.5} />
    </Link>
  );

  // 도착 확인 푸시를 눌러 들어오면(/?trip=<id>) 그 안내의 출발 안내 화면을 바로 연다. 이미 도착을 기록했거나 없는 안내면 무시한다.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- 주소로 들어온 안내를 한 번 여는 동기화라 effect 안에서 상태를 바꾼다. */
    const id = new URLSearchParams(window.location.search).get("trip");
    if (!id) return;
    if (!pushTracked.current) {
      pushTracked.current = true;
      amplitude.track("Arrival Push Opened");
    }
    const trip = trips.find((t) => t.id === id);
    if (!trip) return; // 저장된 기록을 아직 못 읽었을 수 있어 주소는 그대로 두고 다음에 다시 본다.
    window.history.replaceState(null, "", window.location.pathname);
    if (trip.status !== "planned") return;
    openedFromPush.current = trip.id;
    setGroups(null);
    setPage(0);
    setActiveId(trip.id);
    setEditing(false);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [trips]);

  // 홈 입력 화면이 열릴 때마다 출발지를 현재 위치로 자동 입력한다. 위치를 못 읽으면(권한 꺼짐, http 주소 등) 조용히 건너뛰고
  // 마지막으로 고른 출발지를 그대로 둔다. 직접 고르거나 안내 내역에서 불러온 출발지는 지킨다.
  const showingForm = !current && !moving && home !== undefined && home !== null;
  useEffect(() => {
    if (!showingForm) return;
    let cancelled = false;
    if (!isOriginLocked()) {
      readCurrentPlace()
        .then((p) => {
          if (cancelled || isOriginLocked()) return;
          saveLastOrigin({ name: p.name, area: p.address, lat: p.lat, lng: p.lng });
          // 직접 고른 출발지가 있었다면 현재 위치로 되돌린다.
          setEdit(withoutOrigin);
        })
        .catch(() => {});
    }
    return () => {
      cancelled = true;
      // 홈 입력 화면을 벗어나면(검색, 다른 탭) 직접 고른 출발지와 불러온 출발지를 놓는다. 돌아오면 다시 현재 위치.
      unlockOrigin();
      setEdit(withoutOrigin);
    };
  }, [showingForm]);

  // 출발 안내 화면이 떠 있는 동안에는 나갈 때 확인 창을 띄운다. (이미 출발했으면 이동 중 카드로 돌아올 수 있어 띄우지 않는다.)
  const showingResult = Boolean(current);
  const guardLeave = showingResult && !current?.departedAt;
  useEffect(() => {
    setLeaveGuard(guardLeave);
    return () => setLeaveGuard(false);
  }, [guardLeave]);

  // 출발 안내 화면에서 탭바 홈을 누르면(확인 후) 입력 화면(홈)으로 돌아간다.
  useEffect(() => {
    if (!showingResult) return;
    const goHome = () => {
      setEditing(true);
      setActiveId(null);
      setGroups(null);
    };
    window.addEventListener(GO_HOME_EVENT, goHome);
    return () => window.removeEventListener(GO_HOME_EVENT, goHome);
  }, [showingResult]);

  // 출발 안내와 입력 화면을 오갈 때, 앞 화면에서 내려가 있던 스크롤 위치가 남지 않게 맨 위에서 시작한다.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [showingResult]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const origin = form.origin;
    if (!origin) {
      setPicker("origin");
      return;
    }
    if (!form.destination) {
      setError("도착지를 선택해 주세요.");
      return;
    }
    const now = new Date();
    const arriveBy = parseTime(form.time);
    if (!form.tomorrow && arriveBy <= now.getHours() * 60 + now.getMinutes()) {
      setError("이미 지난 약속 시각이에요. '내일 약속' 토글을 켜 보세요.");
      return;
    }
    const date = dateString(form.tomorrow ? 1 : 0);

    setError(null);
    setLoading(true);
    try {
      const { lat, lng, name, area } = form.destination;
      const result = await requestPlans({
        origin: { name: origin.name, area: origin.area, lat: origin.lat, lng: origin.lng },
        destination: { name, area, lat, lng },
        arriveBy,
        buffer: ARRIVE_EARLY_MIN,
        date,
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setGroups(result.groups ?? groupPlans(result.plans));
      setTab("recommended");
      setPage(0);
      // 추천 안을 우선 저장하고, 다른 안으로 도착 기록을 남기면 그 안으로 바꾼다.
      setActiveId(addTrip(result.plan).id);
      // 검색을 마치면 도착지를 비운다. 뒤로 와도 도착지는 새로 고르게 하고, 출발지는 현재 위치로 다시 채워진다.
      clearLastDestination();
      setEdit((e) => {
        const next = { ...e };
        delete next.destination;
        return next;
      });
      setEditing(false);
    } catch {
      setError("경로를 계산하지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  /** 계획대로 가지 못했을 때: 지금 위치에서 같은 도착지로 지금 출발하는 경로를 바로 찾아 출발 안내를 연다. */
  async function missedTrip(trip: Trip) {
    const dest = trip.plan.destCoord;
    if (!dest) {
      setMissedError("도착지 정보를 찾지 못했어요. 상세에서 다시 검색해 주세요.");
      return;
    }
    setMissing(true);
    setMissedError(null);
    try {
      const here = await readCurrentPlace().catch(() => null);
      if (!here) {
        setMissedError("현재 위치를 확인하지 못했어요. 위치 권한을 허용해 주세요.");
        return;
      }
      const result = await requestPlans({
        origin: { name: here.name, area: here.address, lat: here.lat, lng: here.lng },
        destination: { name: trip.plan.destination, area: "", lat: dest.lat, lng: dest.lng },
        arriveBy: trip.plan.arriveBy, // 원래 약속 시각. 지각 여부를 알리는 데만 쓴다.
        buffer: 0,
        date: dateString(0),
        mode: "now",
      });
      if (!result.ok) {
        setMissedError(result.message);
        return;
      }
      setGroups(result.groups ?? groupPlans(result.plans));
      setTab("recommended");
      setPage(0);
      // 이동 중이던 이전 안내는 그대로 두고, 새 안내로 출발하는 순간 정리한다. (결과를 보고 뒤로 돌아올 수 있게)
      setActiveId(addTrip(result.plan).id);
      setEditing(false);
    } catch {
      setMissedError("경로를 계산하지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setMissing(false);
    }
  }

  if (current) {
    const done = current.status !== "planned";
    // 출발하거나 기록을 남긴 뒤에는 따라간 안 하나만 보여준다.
    const departed = Boolean(current.departedAt);
    // 출발 전에는 고른 칩의 안들을 보여주고(추천은 하나), 칩에 해당하는 경로가 없으면 지금 안 하나만 보여준다.
    const choices = !done && !departed && groups ? (tab === "recommended" ? [groups.recommended] : groups[tab]) : [];
    const filtering = choices.length > 0;
    const shown = filtering ? choices : [current.plan];
    const active = shown[Math.min(page, shown.length - 1)];
    const changeTab = (t: PlanTab) => {
      setTab(t);
      setPage(0);
    };

    const depart = () => {
      // 장소·주소 이름은 보내지 않는다. 어떤 종류의 안으로 출발했는지만 기록한다.
      amplitude.track("Departure Recorded", {
        planned_departure_time: fmt(active.leaveAt),
        departure_diff_min: nowMinutes() - active.leaveAt, // 실제 누른 시각 - 안내된 출발 시각
        plan_tab: tab,
        is_recommended: groups ? active === groups.recommended : true,
        transfers: active.transfers,
      });
      // 놓쳐서 다시 찾은 안으로 출발하면, 이동 중이던 이전 안내는 끝난 것으로 정리하고 도착 알림도 취소한다.
      for (const t of trips) {
        if (t.id !== current.id && t.departedAt && t.status === "planned") {
          removeTrip(t.id);
          void cancelArrivalReminder(t.id);
        }
      }
      recordDeparture(current.id, active === current.plan ? undefined : active);
      setPage(0);
      setDepartedAlert(active.arriveAt - active.leaveAt);
      amplitude.track("Alert Panel Shown", { alert_type: "departed_guide" });
    };
    // 안내 얼럿의 확인을 누르면 "도착하셨나요?" 알림을 예약한다. 알림을 아직 허용하지 않았다면 이때 허용 창이 뜬다.
    const confirmDeparted = () => {
      if (departedAlert !== null) void scheduleArrivalReminder(current.id, departedAlert);
      setDepartedAlert(null);
    };
    const arrive = (plan: Plan, onTime: boolean) => {
      // 같은 안내에는 한 번만 보낸다. (이미 기록했거나, 빠르게 두 번 눌러도)
      if (current.status === "planned" && arrivalTracked.current !== current.id) {
        arrivalTracked.current = current.id;
        amplitude.track("Arrival Recorded", {
          on_time: onTime,
          appointment_time: fmt(plan.arriveBy),
          arrival_diff_min: nowMinutes() - plan.arriveBy, // 실제 누른 시각 - 약속 시간 (음수면 일찍 도착)
          source: openedFromPush.current === current.id ? "push" : "direct", // 도착 푸시를 눌러 들어온 안내면 push
        });
      }
      recordArrival(current.id, onTime, plan === current.plan ? undefined : plan);
      void cancelArrivalReminder(current.id);
      // 처음 도착하면 1초 뒤 피드백 얼럿이 뜨고, 그 얼럿을 닫으면 로드맵으로 간다. 이때는 기록 완료 얼럿을 겹쳐 띄우지 않는다.
      const askingFeedback = !hasAskedFeedback();
      notifyArrived();
      if (!askingFeedback) setArrivedAlert(true);
    };
    const closeArrivedAlert = () => {
      setArrivedAlert(false);
      // 그려진 길을 볼 수 있게 로드맵으로 간다.
      router.push("/roadmap");
    };

    return (
      <main className="fade-in -mb-[23px]">
        {/* 위로 스크롤하면 맨 위에 붙어 있도록 sticky. 위쪽 여백은 상태 표시줄에 바짝 붙게 최소로 둔다. */}
        <nav className="sticky top-0 z-20 flex items-center gap-1 bg-sky-pale/80 px-2 pt-2 backdrop-blur-glass">
          <Button
            type="button"
            variant="ghost"
            size="icon-lg"
            aria-label="뒤로가기 (입력 화면으로)"
            onClick={() =>
              requestLeave(() => {
                setEditing(true);
                setActiveId(null);
                setGroups(null);
              })
            }
          >
            <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 5-7 7 7 7" />
            </svg>
          </Button>
          <h1 className="text-subheading font-medium">출발 안내</h1>
          {/* 출발한 뒤에만: 맨 오른쪽 점 세 개 메뉴 */}
          {departed && !done && (
            <div className="ml-auto">
              <TripMenu
                plan={current.plan}
                onCancelDeparture={() => {
                  cancelDeparture(current.id);
                  void cancelArrivalReminder(current.id);
                }}
              />
            </div>
          )}
        </nav>
        <div className="h-4" />

        {/* 칩 필터: 추천 / 지하철 우선 / 버스 우선. 출발하기 전에만 보인다. */}
        {filtering && groups && (
          <PlanFilter
            value={tab}
            onChange={changeTab}
            unavailable={{ subway: groups.subway.length === 0, bus: groups.bus.length === 0 }}
            count={shown.length}
            page={Math.min(page, shown.length - 1)}
          />
        )}

        <PlanSlider page={Math.min(page, shown.length - 1)} onPageChange={setPage} resetKey={`${current.id}:${tab}`}>
          {shown.map((plan, i) => (
            <article key={i}>
              <PlanView plan={plan} delta={filtering && groups && plan !== groups.recommended ? groups.recommended.leaveAt - plan.leaveAt : 0} />
            </article>
          ))}
        </PlanSlider>

        {/* 경로 아래 20px에 붙어 있다가, 경로가 길어 스크롤이 생기면 탭바 바로 위에 달라붙는다. */}
        {!done && (
          // 뒤 내용이 자연스럽게 묻히도록 위는 투명, 아래는 흰색으로 이어지는 그라데이션. 빈 부분은 클릭이 아래 내용으로 지나간다.
          <div className="pointer-events-none sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-10 bg-linear-to-b from-surface/0 to-surface to-30% px-5 pb-3 pt-5">
            <div className="pointer-events-auto">
              <TripActionButton
                departedAt={current.departedAt}
                durationMin={active.arriveAt - active.leaveAt}
                onDepart={depart}
                onArrive={(onTime) => arrive(active, onTime)}
                notToday={Boolean(active.date && active.date > dateString(0))}
              />
            </div>
          </div>
        )}

        {departedAlert !== null && (
          <AlertPanel
            title={`${departedAlert}분 뒤 도착 예정`}
            description="알림을 허용해 주세요. 도착하면 이동 중인 상태를 완료하도록 도와드릴게요."
          >
            <Button size="lg" autoFocus onClick={confirmDeparted}>
              확인
            </Button>
          </AlertPanel>
        )}

        {arrivedAlert && (
          <AlertPanel
            title="로드맵 기록 완료"
            description="확인을 누르면 로드맵으로 이동해요."
            onClose={closeArrivedAlert}
          >
            <Button size="lg" autoFocus onClick={closeArrivedAlert}>
              확인
            </Button>
          </AlertPanel>
        )}
      </main>
    );
  }

  if (moving && !showHomePicker) {
    return (
      <main className="fade-in relative isolate">
        <SkyBackdrop />
        <ThemeColor token="sky" />
        <Header title="J의 외출" sub="지금 이동 중이에요." onSky action={settingsLink} />
        <div className="px-5 pb-8">
          <TripProgressCard
            origin={moving.plan.origin}
            destination={moving.plan.destination}
            leaveAt={moving.plan.leaveAt}
            arriveAt={moving.plan.arriveAt}
            onDetail={() => {
              setGroups(null);
              setPage(0);
              setActiveId(moving.id);
              setEditing(false);
            }}
            onMissed={() => setMissedConfirm(true)}
            missing={missing}
            missedError={missedError}
          />
        </div>

        {missedConfirm && (
          <AlertPanel description="현재 위치를 기준으로 경로를 재안내해요.">
            <Button variant="secondary" size="lg" onClick={() => setMissedConfirm(false)}>
              취소
            </Button>
            <Button
              size="lg"
              autoFocus
              onClick={() => {
                setMissedConfirm(false);
                void missedTrip(moving);
              }}
            >
              확인
            </Button>
          </AlertPanel>
        )}
      </main>
    );
  }

  return (
    <main className="fade-in relative isolate">
      <SkyBackdrop />
      <ThemeColor token="sky" />
      <Header
        title="J의 외출"
        sub="어디로, 몇 시까지 갈지만 알려주세요."
        onSky
        action={settingsLink}
      />

      {showHomePicker && (
        <LocationPicker
          title="집 주소 등록"
          description={
            needHome ? (
              <>
                집 주소를 먼저 등록해 주세요.
                <br />
                출발지·도착지를 고를 때 &lsquo;집&rsquo;으로 바로 선택할 수 있어요.
              </>
            ) : (
              "새 집 주소를 현재 위치나 주소로 찾아 보세요."
            )
          }
          autoLocate={needHome}
          confirmQuestion="여기가 집이 맞나요?"
          confirmLabel="네, 집으로 등록할게요"
          onSelect={(p) => {
            // 처음 등록할 때만 센다. (집 주소 변경은 해당하지 않는다)
            if (needHome) amplitude.track("Home Address Registered", { method: p.source ?? "search" });
            saveHome({ name: "집", area: p.address || p.name, lat: p.lat, lng: p.lng });
            leaveHomePicker();
          }}
          onClose={needHome ? undefined : leaveHomePicker}
        />
      )}

      {picker === "origin" && (
        <LocationPicker
          title="출발지 선택"
          description="출발할 곳을 현재 위치나 주소로 찾아 보세요."
          near={form.destination ?? undefined}
          homeChip={homeChip((place) => {
            set("origin", place);
            saveLastOrigin(place);
            setPicker(null);
          })}
          confirmQuestion="여기를 출발지로 선택할까요?"
          confirmLabel="네, 여기서 출발할게요"
          onSelect={(p) => {
            const place = { name: p.name, area: p.address, lat: p.lat, lng: p.lng };
            set("origin", place);
            saveLastOrigin(place);
            setPicker(null);
          }}
          onClose={() => setPicker(null)}
        />
      )}

      {picker === "destination" && (
        <LocationPicker
          title="도착지 선택"
          near={form.origin ?? undefined}
          homeChip={homeChip((place) => {
            set("destination", place);
            saveLastDestination(place);
            setPicker(null);
          })}
          description="약속 장소를 현재 위치나 주소로 찾아 보세요."
          confirmQuestion="여기를 도착지로 선택할까요?"
          confirmLabel="네, 여기로 갈게요"
          onSelect={(p) => {
            const place = { name: p.name, area: p.address, lat: p.lat, lng: p.lng };
            set("destination", place);
            saveLastDestination(place);
            setPicker(null);
          }}
          onClose={() => setPicker(null)}
        />
      )}

      <form onSubmit={submit} className="space-y-3 px-5 pb-8">
        <RouteCard
          origin={form.origin}
          destination={form.destination}
          time={form.time}
          onPickOrigin={() => setPicker("origin")}
          onPickDestination={() => setPicker("destination")}
          onTimeChange={(v) => set("time", v)}
          onSwap={() => {
            // 출발지와 도착지를 맞바꾼다. (둘 다 이번 입력에서만 바뀌고, 홈을 벗어나면 출발지는 다시 현재 위치)
            const { origin, destination } = form;
            set("origin", destination);
            set("destination", origin);
          }}
        />

        <div className="glass flex h-14 items-center justify-between rounded-nav px-4">
          <span id="tomorrow-label" className="text-body text-on-surface">
            내일 약속이에요
          </span>
          <Switch
            checked={form.tomorrow}
            onCheckedChange={(v) => set("tomorrow", v)}
            aria-labelledby="tomorrow-label"
          />
        </div>

        {error && (
          <p role="alert" className="text-body text-on-danger">
            {error}
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          disabled={loading}
          // 버튼을 누를 때마다 한 번. 계산 중에는 버튼이 비활성이라 중복으로 눌리지 않는다.
          onClick={() => {
            const searchMin = nowMinutes();
            amplitude.track("Route Search Clicked", {
              appointment_time: form.time,
              search_time: fmt(searchMin),
              destination: form.destination?.name ?? null,
              is_tomorrow: form.tomorrow,
              minutes_until_appointment: (form.tomorrow ? 1440 : 0) + parseTime(form.time) - searchMin, // 약속 시간 - 검색 시각
            });
          }}
          className="mt-1.5 h-[54px] w-full text-body-lg"
        >
          {loading ? "실제 시간표 확인 중…" : "나갈 시각 알아보기"}
        </Button>
      </form>
    </main>
  );
}

/** 지금 시각(분, 0~1439) */
const nowMinutes = () => {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
};

const DAY = { weekday: "평일", saturday: "토요일", sunday: "일요일" } as const;

const PlanView = memo(function PlanView({ plan, delta = 0 }: { plan: Plan; delta?: number }) {
  return (
    <>
      <section className="px-5 pb-[26px]">
        {/* 추천이 아닌 안에서만: 추천과 출발 시각이 얼마나 다른지 */}
        {delta !== 0 && (
          <p className="mb-2 text-caption text-muted-foreground">
            {delta > 0 ? `추천보다 ${delta}분 일찍 나가야 해요` : `추천보다 ${-delta}분 늦게 나가도 돼요`}
          </p>
        )}
        {plan.departNow ? (
          // 놓쳐서 지금 위치에서 다시 찾은 안: "지금 출발하면 00:00에 도착해요"
          <>
            <p className="text-time font-medium">
              <span className="text-subheading font-medium text-on-surface">지금 출발하면</span>
            </p>
            <p className="text-time font-medium">
              <span className="font-bold">{fmt(plan.arriveAt)}</span>
              <span className="ml-1 text-subheading font-medium text-on-surface">에 도착해요</span>
            </p>
            <p className="mt-3 text-body text-muted-foreground">
              {plan.arriveBy - plan.arriveAt >= 0
                ? `약속(${fmt(plan.arriveBy)}) ${plan.arriveBy - plan.arriveAt}분 전 도착`
                : `약속(${fmt(plan.arriveBy)})보다 ${plan.arriveAt - plan.arriveBy}분 늦어요`}
            </p>
          </>
        ) : (
          <>
            <p className="text-time font-medium">
              <span className="font-bold text-brand">{fmt(plan.leaveAt)}</span>
              <span className="ml-1 text-subheading font-medium text-on-surface">에 출발하면</span>
            </p>
            <p className="text-time font-medium">
              <span className="font-bold">{fmt(plan.arriveAt)}</span>
              <span className="ml-1 text-subheading font-medium text-on-surface">에 도착해요</span>
            </p>
            <p className="mt-3 text-body text-muted-foreground">약속 {plan.arriveBy - plan.arriveAt}분 전 도착</p>
          </>
        )}
      </section>

      <div className="border-t border-divider" />

      <section className="px-5 pt-[22px]">
        <Timeline plan={plan} />
        <SourceNote plan={plan} />
      </section>
    </>
  );
});

/** 경로 아래에 작게 적는 출처·기준 안내 */
function SourceNote({ plan }: { plan: Plan }) {
  const notes: string[] = [];
  const hasRide = plan.legs.some((l) => l.type === "ride");
  const hasBus = plan.legs.some((l) => l.type === "bus");
  if (hasRide) {
    // 출처는 서울교통공사 시간표로 실제 열차를 맞춘 구간이 있을 때만 적는다.
    if (plan.legs.some((l) => l.type === "ride" && l.scheduled)) {
      notes.push(`${DAY[plan.dayType ?? "weekday"]} 열차 시간표 기준 · 출처 서울교통공사`);
    }
    if (plan.scheduleEstimated) notes.push("시간표가 없는 노선은 배차 간격으로 예상한 시각이에요");
  }
  if (plan.walkEstimated) notes.push("일부 도보 시간은 직선거리로 추정했어요");
  return (
    <>
      {notes.length > 0 && (
        <div className="mt-6 space-y-1 text-caption text-muted-foreground">
          {notes.map((n) => (
            <p key={n}>{n}</p>
          ))}
        </div>
      )}
      {hasBus && (
        <p className="mt-4 rounded-card bg-note-fill px-3 py-3 text-caption text-muted-foreground">
          {plan.busEstimated
            ? "버스 도착 정보가 없거나 약속이 2시간 이상 남은 경우, 배차 간격을 기준으로 안내해요. 약속 1~2시간 전에 다시 확인하면 좀 더 명확하게 알려드려요."
            : "버스 시각은 지금 버스 도착 정보를 바탕으로 예상하여 실제와 몇 분 차이가 있을 수 있어요."}
        </p>
      )}
    </>
  );
}
