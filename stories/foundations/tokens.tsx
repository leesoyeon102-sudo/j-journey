import YAML from "yaml"

// DESIGN.md의 YAML 영역을 직접 읽는다. 값을 따로 복사해 두지 않으므로 문서와 어긋나지 않는다.
import designMd from "../../DESIGN.md?raw"

type Typography = {
  fontFamily: string
  fontSize: string
  fontWeight: number
  lineHeight: number
  letterSpacing?: string
}

const tokens = YAML.parse(designMd.split("---")[1]) as {
  colors: Record<string, string>
  typography: Record<string, Typography>
  spacing: Record<string, string>
  rounded: Record<string, string>
}

const label = { fontSize: 14, fontWeight: 500 } as const
const mono = { fontSize: 12, color: "var(--color-muted-foreground)" } as const

export function Colors() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 16 }}>
      {Object.entries(tokens.colors).map(([name, value]) => (
        <div key={name}>
          <div
            style={{
              height: 72,
              background: value,
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-card)",
            }}
          />
          <div style={{ ...label, marginTop: 8 }}>{name}</div>
          <div style={mono}>{value}</div>
        </div>
      ))}
    </div>
  )
}

export function Typographies() {
  return (
    <div style={{ display: "grid", gap: 20 }}>
      {Object.entries(tokens.typography).map(([name, t]) => (
        <div key={name} style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 24, alignItems: "baseline" }}>
          <div>
            <div style={label}>{name}</div>
            <div style={mono}>
              {t.fontWeight} · {t.fontSize} / {Math.round(t.lineHeight * 100)}%
            </div>
          </div>
          <div
            style={{
              fontFamily: t.fontFamily.endsWith("L") ? "var(--font-heading)" : "var(--font-sans)",
              fontSize: t.fontSize,
              fontWeight: t.fontWeight,
              lineHeight: t.lineHeight,
              letterSpacing: t.letterSpacing,
            }}
          >
            {name === "display" ? "10:30" : "10:30에 출발하세요"}
          </div>
        </div>
      ))}
    </div>
  )
}

export function Spacing() {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {Object.entries(tokens.spacing).map(([name, value]) => (
        <div key={name} style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 24, alignItems: "center" }}>
          <div>
            <div style={label}>{name}</div>
            <div style={mono}>{value}</div>
          </div>
          {/* 1200px 같은 큰 값은 막대가 문서 폭을 넘지 않게 자른다. */}
          <div style={{ width: value, maxWidth: "100%", height: 16, background: "var(--color-primary)" }} />
        </div>
      ))}
    </div>
  )
}

export function Rounded() {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
      {Object.entries(tokens.rounded).map(([name, value]) => (
        <div key={name}>
          <div
            style={{
              width: 88,
              height: 88,
              background: "var(--color-muted)",
              border: "1px solid var(--color-border)",
              borderRadius: value,
            }}
          />
          <div style={{ ...label, marginTop: 8 }}>{name}</div>
          <div style={mono}>{value}</div>
        </div>
      ))}
    </div>
  )
}
