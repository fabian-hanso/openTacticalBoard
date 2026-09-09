import {
  ArrowRight,
  Copy,
  Download,
  Frame,
  Hand,
  MousePointer2,
  MoveRight,
  Pencil,
  Smartphone,
  Triangle,
} from "lucide-react";
import Link from "next/link";
import {
  ARROW_COLORS,
  EQUIPMENT_COLORS,
  FIELD_GRASS,
  FIELD_LINES,
  FREEHAND_COLOR,
  ROLE_COLORS,
} from "@/lib/colors";
import { FIELD_TEMPLATES } from "@/lib/fieldTemplates";
import { FIELD_MARGIN_METERS } from "@/lib/geometry/ppm";
import type { FieldMarking, FieldTemplateConfig } from "@/lib/types/field";

const ACCENT = ROLE_COLORS.goalkeeper; // amber — the goalkeeper's own color, doubles as the brand accent

const FEATURES: { icon: typeof Frame; title: string; description: string; tint?: string }[] = [
  {
    icon: Frame,
    title: "Maßstabsgetreue Feldausschnitte",
    description:
      "Ganzes Feld, Halbfeld, 16er, 5er oder ein frei wählbarer Bereich wie 5 × 2 m – alles proportional korrekt.",
  },
  {
    icon: Hand,
    title: "Torhüter, Trainer & Feldspieler",
    description: "Farblich klar getrennte Rollen, frei platzierbar, verschieb- und vergrößerbar.",
    tint: ROLE_COLORS.goalkeeper,
  },
  {
    icon: Copy,
    title: "Mehrere Szenen",
    description: "Eine ganze Trainingseinheit als Szenenfolge aufbauen, duplizieren und umsortieren.",
  },
  {
    icon: Triangle,
    title: "Volle Ausrüstung",
    description: "Hütchen, kleine Hütchen, Hürden, Stangen, Koordinationsleiter, Minitore und Ball.",
    tint: EQUIPMENT_COLORS.cone,
  },
  {
    icon: Pencil,
    title: "Pfeile & Freihand",
    description: "Lauf-, Pass- und Dribbling-Pfeile sowie ein Freihand-Stift für Laufwege und Zonen.",
    tint: FREEHAND_COLOR,
  },
  {
    icon: MousePointer2,
    title: "Mehrfachauswahl",
    description: "Mehrere Objekte per Lasso markieren und gemeinsam verschieben – ideal für Hütchen-Reihen.",
  },
  {
    icon: Download,
    title: "PNG-Export",
    description: "Jede Szene in Druckqualität exportieren, unabhängig vom aktuellen Zoom.",
    tint: ARROW_COLORS.run,
  },
  {
    icon: Smartphone,
    title: "Am Feldrand nutzbar",
    description: "Läuft im Browser auf Desktop und Handy – mit Pinch-Zoom und Touch-Bedienung.",
  },
];

const STATS = ["5 Feldvorlagen", "10+ Objekttypen", "Beliebig viele Szenen", "PNG-Export"];

const STEPS = [
  {
    title: "Feldausschnitt wählen",
    description: "Vom ganzen Feld bis zum frei wählbaren 5 × 2 m Bereich – maßstabsgetreu.",
  },
  {
    title: "Objekte platzieren & einzeichnen",
    description: "Spieler, Ausrüstung und Pfeile per Klick setzen, verschieben, skalieren.",
  },
  {
    title: "Als Bild exportieren",
    description: "Szene in Druckqualität sichern oder direkt mit der Mannschaft teilen.",
  },
];

// Renders one real field-template marking (the exact same data the board
// itself draws) as an SVG element, scaled down for the thumbnail.
function renderMarking(marking: FieldMarking, key: number, scale: number) {
  switch (marking.kind) {
    case "line":
      return (
        <line
          key={key}
          x1={marking.points[0] * scale}
          y1={marking.points[1] * scale}
          x2={marking.points[2] * scale}
          y2={marking.points[3] * scale}
          stroke={FIELD_LINES}
          strokeWidth="1"
        />
      );
    case "rect":
      return (
        <rect
          key={key}
          x={marking.x * scale}
          y={marking.y * scale}
          width={marking.width * scale}
          height={marking.height * scale}
          stroke={FIELD_LINES}
          strokeWidth="1"
          fill="none"
        />
      );
    case "circle":
      return (
        <circle
          key={key}
          cx={marking.cx * scale}
          cy={marking.cy * scale}
          r={marking.radius * scale}
          stroke={FIELD_LINES}
          strokeWidth="1"
          fill="none"
        />
      );
    case "spot":
      return <circle key={key} cx={marking.cx * scale} cy={marking.cy * scale} r={Math.max(1, 0.12 * scale)} fill={FIELD_LINES} />;
    case "arc": {
      const startRad = (marking.startAngleDeg * Math.PI) / 180;
      const endRad = (marking.endAngleDeg * Math.PI) / 180;
      const cx = marking.cx * scale;
      const cy = marking.cy * scale;
      const r = marking.radius * scale;
      const x1 = cx + r * Math.cos(startRad);
      const y1 = cy + r * Math.sin(startRad);
      const x2 = cx + r * Math.cos(endRad);
      const y2 = cy + r * Math.sin(endRad);
      const largeArc = Math.abs(marking.endAngleDeg - marking.startAngleDeg) > 180 ? 1 : 0;
      return (
        <path key={key} d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`} stroke={FIELD_LINES} strokeWidth="1" fill="none" />
      );
    }
    default:
      return null;
  }
}

function FieldPreview({ template }: { template: FieldTemplateConfig }) {
  const boxSize = 108;
  const totalWidth = template.widthMeters + FIELD_MARGIN_METERS * 2;
  const totalHeight = template.heightMeters + FIELD_MARGIN_METERS * 2;
  const scale = boxSize / Math.max(totalWidth, totalHeight);
  const w = totalWidth * scale;
  const h = totalHeight * scale;
  const offset = FIELD_MARGIN_METERS * scale;
  const fieldW = template.widthMeters * scale;
  const fieldH = template.heightMeters * scale;
  // A fixed pixel-based grid, purely decorative and independent of the
  // template's real (meters-accurate) grid — keeps all five thumbnails
  // visually consistent regardless of the field's actual size.
  const previewGridStepPx = boxSize / 9;

  return (
    <div className="flex h-28 items-center justify-center">
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-hidden>
        <g transform={`translate(${offset} ${offset})`}>
          <rect width={fieldW} height={fieldH} fill={FIELD_GRASS} />
          {Array.from({ length: Math.floor(fieldW / previewGridStepPx) }).map((_, i) => (
            <line
              key={`v${i}`}
              x1={(i + 1) * previewGridStepPx}
              y1={0}
              x2={(i + 1) * previewGridStepPx}
              y2={fieldH}
              stroke={FIELD_LINES}
              strokeWidth="0.5"
              opacity="0.35"
            />
          ))}
          {Array.from({ length: Math.floor(fieldH / previewGridStepPx) }).map((_, i) => (
            <line
              key={`h${i}`}
              x1={0}
              y1={(i + 1) * previewGridStepPx}
              x2={fieldW}
              y2={(i + 1) * previewGridStepPx}
              stroke={FIELD_LINES}
              strokeWidth="0.5"
              opacity="0.35"
            />
          ))}
          {template.markings.map((m, i) => renderMarking(m, i, scale))}
          <rect width={fieldW} height={fieldH} stroke={FIELD_LINES} strokeWidth="1" fill="none" />
        </g>
      </svg>
    </div>
  );
}

function PitchIllustration() {
  return (
    <svg viewBox="0 0 320 200" className="h-auto w-full max-w-md" role="img" aria-label="Beispielhafte Taktikszene">
      <rect x="8" y="8" width="304" height="184" rx="6" fill={FIELD_GRASS} />
      <g stroke={FIELD_LINES} strokeWidth="1.5" fill="none" opacity="0.9">
        <rect x="8" y="8" width="304" height="184" rx="6" />
        <line x1="160" y1="8" x2="160" y2="192" />
        <circle cx="160" cy="100" r="28" />
        <rect x="8" y="55" width="46" height="90" />
        <rect x="266" y="55" width="46" height="90" />
      </g>
      <path
        d="M 70 150 Q 100 130 90 110 Q 80 92 110 78"
        stroke={ARROW_COLORS.dribble}
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      <line
        x1="180"
        y1="60"
        x2="230"
        y2="40"
        stroke={ARROW_COLORS.pass}
        strokeWidth="2.5"
        strokeDasharray="6 4"
        markerEnd="url(#arrowhead)"
      />
      <defs>
        <marker id="arrowhead" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
          <path d="M0,0 L7,3.5 L0,7 Z" fill={ARROW_COLORS.pass} />
        </marker>
      </defs>
      <polygon points="140,120 146,132 134,132" fill={EQUIPMENT_COLORS.cone} />
      <polygon points="118,140 124,152 112,152" fill={EQUIPMENT_COLORS.cone} />
      <circle cx="31" cy="100" r="10" fill={ROLE_COLORS.goalkeeper} stroke="#1f2937" strokeWidth="1" />
      <circle cx="230" cy="40" r="9" fill={ROLE_COLORS.outfield} stroke="#1f2937" strokeWidth="1" />
      <circle cx="70" cy="150" r="9" fill={ROLE_COLORS.outfield} stroke="#1f2937" strokeWidth="1" />
      <circle cx="200" cy="150" r="9" fill={ROLE_COLORS.coach} stroke="#1f2937" strokeWidth="1" />
    </svg>
  );
}

function CtaButton({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <Link
      href="/board"
      className={`group inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 ${className}`}
      style={{ backgroundColor: ACCENT, boxShadow: `0 10px 25px -10px ${ACCENT}66` }}
    >
      {children}
      <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

export default function LandingPage() {
  return (
    <div className="flex min-h-full w-full flex-col bg-chrome-bg">
      <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b border-chrome-border bg-chrome-panel/80 px-4 backdrop-blur sm:px-6">
        <span className="text-sm font-semibold text-chrome-text">Torwarttrainer Taktikboard</span>
        <Link
          href="/board"
          className="rounded-full px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition-opacity hover:opacity-90"
          style={{ backgroundColor: ACCENT }}
        >
          Board öffnen
        </Link>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div
              className="absolute -left-24 -top-32 h-96 w-96 rounded-full opacity-[0.16] blur-3xl"
              style={{ backgroundColor: ACCENT }}
            />
            <div
              className="absolute -bottom-40 -right-24 h-112 w-md rounded-full opacity-[0.14] blur-3xl"
              style={{ backgroundColor: FIELD_GRASS }}
            />
          </div>

          <div className="mx-auto flex max-w-5xl flex-col items-center gap-12 px-6 py-20 sm:py-28 lg:flex-row lg:items-center lg:gap-16">
            <div className="flex flex-1 flex-col items-start gap-6">
              <span
                className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
                style={{ backgroundColor: `${ACCENT}26`, color: "#92650a" }}
              >
                Für Torwarttrainer
              </span>
              <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-chrome-text sm:text-5xl">
                Trainingseinheiten planen –<br />
                <span style={{ color: ACCENT }}>exakt maßstäblich.</span>
              </h1>
              <p className="max-w-md text-base leading-relaxed text-chrome-muted">
                Die meisten Taktikboards zeigen nur das ganze Feld oder Halbfeld. Für
                Torwarttraining braucht es mehr: den 16er, den 5er oder einen frei wählbaren
                Bereich wie 5 × 2&nbsp;m – alles proportional korrekt, mit Hütchen, Hürden,
                Stangen und Co. frei platziert.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <CtaButton>Board öffnen</CtaButton>
                <span className="text-xs text-chrome-muted">
                  Kostenlos · läuft direkt im Browser · keine Installation
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-2 text-xs text-chrome-muted">
                {STATS.map((stat, i) => (
                  <span key={stat} className="flex items-center gap-3">
                    {i > 0 && <span className="h-1 w-1 rounded-full bg-chrome-border" />}
                    {stat}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-1 justify-center">
              <div className="rounded-2xl border border-chrome-border bg-chrome-panel p-4 shadow-2xl shadow-black/10">
                <PitchIllustration />
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-chrome-border">
          <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
            <div className="mb-10 flex flex-col items-center gap-2 text-center">
              <span
                className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
                style={{ backgroundColor: `${ACCENT}26`, color: "#92650a" }}
              >
                Fünf Ausschnitte
              </span>
              <h2 className="text-2xl font-bold text-chrome-text sm:text-3xl">
                Jede Übung im passenden Maßstab
              </h2>
              <p className="max-w-lg text-sm text-chrome-muted">
                Nicht jede Einheit braucht das ganze Feld. Wähle den Ausschnitt, der zur Übung
                passt – vom kompletten Platz bis zum 5 × 2&nbsp;m Reaktionsfeld.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {FIELD_TEMPLATES.map((tpl) => (
                <div
                  key={tpl.id}
                  className="flex flex-col items-center gap-3 rounded-xl border border-chrome-border bg-chrome-panel p-4 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-black/5"
                >
                  <FieldPreview template={tpl} />
                  <div className="text-center">
                    <h3 className="text-sm font-semibold text-chrome-text">{tpl.label}</h3>
                    <p className="text-xs text-chrome-muted">{tpl.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-chrome-border bg-chrome-panel/40">
          <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
            <div className="mb-10 flex flex-col items-center gap-2 text-center">
              <span
                className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
                style={{ backgroundColor: `${ACCENT}26`, color: "#92650a" }}
              >
                Funktionsumfang
              </span>
              <h2 className="text-2xl font-bold text-chrome-text sm:text-3xl">Was das Board kann</h2>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map(({ icon: Icon, title, description, tint }) => (
                <div
                  key={title}
                  className="group flex flex-col gap-3 rounded-xl border border-chrome-border bg-chrome-bg p-5 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-black/5"
                >
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-lg"
                    style={{
                      backgroundColor: tint ? `${tint}26` : "var(--chrome-panel)",
                      color: tint ?? "var(--chrome-text)",
                    }}
                  >
                    <Icon size={19} />
                  </span>
                  <h3 className="text-sm font-semibold text-chrome-text">{title}</h3>
                  <p className="text-sm leading-relaxed text-chrome-muted">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-chrome-border">
          <div className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
            <h2 className="mb-10 text-center text-2xl font-bold text-chrome-text sm:text-3xl">
              So funktioniert&apos;s
            </h2>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-6">
              {STEPS.map((step, i) => (
                <div key={step.title} className="relative flex flex-col items-center gap-3 text-center">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-slate-900"
                    style={{ backgroundColor: ACCENT }}
                  >
                    {i + 1}
                  </span>
                  <h3 className="text-sm font-semibold text-chrome-text">{step.title}</h3>
                  <p className="max-w-56 text-sm leading-relaxed text-chrome-muted">{step.description}</p>
                  {i < STEPS.length - 1 && (
                    <MoveRight
                      size={18}
                      className="absolute -right-3 top-2.5 hidden text-chrome-border sm:block"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden">
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div
              className="absolute left-1/2 top-0 h-72 w-xl -translate-x-1/2 rounded-full opacity-[0.12] blur-3xl"
              style={{ backgroundColor: ACCENT }}
            />
          </div>
          <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-6 py-20 text-center sm:py-24">
            <h2 className="text-2xl font-bold text-chrome-text sm:text-3xl">Bereit für die nächste Einheit?</h2>
            <p className="max-w-md text-sm text-chrome-muted">
              Keine Anmeldung nötig. Deine Szenen bleiben lokal in deinem Browser gespeichert.
            </p>
            <div className="pt-2">
              <CtaButton>Jetzt starten</CtaButton>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-chrome-border px-6 py-6 text-center text-xs text-chrome-muted">
        Torwarttrainer Taktikboard — läuft komplett im Browser, deine Daten bleiben lokal.
      </footer>
    </div>
  );
}
