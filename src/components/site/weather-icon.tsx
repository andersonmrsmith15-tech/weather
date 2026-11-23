import type { Condition } from "@/lib/site-i18n";

const CLOUD = "M19 47a9.5 9.5 0 0 1-.9-18.96A14.5 14.5 0 0 1 46 27.2 10 10 0 0 1 46.5 47z";

function Sun({ small = false }: { small?: boolean }) {
  return (
    <g transform={small ? "translate(-6 -8) scale(0.72)" : undefined} style={small ? { transformOrigin: "32px 32px" } : undefined}>
      <g className="wi-spin" stroke="#fcd34d" strokeWidth="3" strokeLinecap="round">
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i * Math.PI) / 4;
          return <line key={i} x1={32 + Math.cos(a) * 17} y1={32 + Math.sin(a) * 17} x2={32 + Math.cos(a) * 23} y2={32 + Math.sin(a) * 23} />;
        })}
      </g>
      <circle cx="32" cy="32" r="10.5" fill="#fcd34d" fillOpacity="0.25" stroke="#fcd34d" strokeWidth="3" />
    </g>
  );
}

function Moon({ small = false }: { small?: boolean }) {
  return (
    <path
      d="M40 14a17 17 0 1 0 12 26A14 14 0 0 1 40 14z"
      transform={small ? "translate(-10 -8) scale(0.72)" : undefined}
      fill="#e9e3ff" fillOpacity="0.22" stroke="#e9e3ff" strokeWidth="3" strokeLinejoin="round"
    />
  );
}

function Cloud({ y = 0, front = false }: { y?: number; front?: boolean }) {
  return (
    <g className="wi-drift" transform={`translate(${front ? 4 : 0} ${y})`}>
      <path d={CLOUD} fill="rgba(255,255,255,0.18)" stroke="#fff" strokeWidth="3" strokeLinejoin="round" />
    </g>
  );
}

/** Animatsiyali, minimalistik (line) ob-havo ikonkasi. Matnli izoh majburiy. */
export function WeatherIcon({
  cond, night = false, size = 48, label,
}: { cond: Condition; night?: boolean; size?: number; label: string }) {
  const body = (() => {
    switch (cond) {
      case "clear":
        return night ? <Moon /> : <Sun />;
      case "partly":
        return <>{night ? <Moon small /> : <Sun small />}<Cloud y={4} front /></>;
      case "cloudy":
        return <><g opacity="0.55" transform="translate(-8 -7) scale(0.8)" style={{ transformOrigin: "32px 32px" }}><path d={CLOUD} fill="none" stroke="#fff" strokeWidth="3" /></g><Cloud y={3} /></>;
      case "fog":
        return <><Cloud y={-6} /><g stroke="#fff" strokeWidth="3" strokeLinecap="round" className="wi-drift"><line x1="14" y1="49" x2="44" y2="49" /><line x1="20" y1="55" x2="50" y2="55" /></g></>;
      case "drizzle":
      case "rain":
        return (
          <>
            <Cloud y={-7} />
            <g stroke="#7dd3fc" strokeWidth="3" strokeLinecap="round">
              {[22, 32, 42].map((x, i) => (
                <line key={x} className="wi-drop" style={{ animationDelay: `${i * 0.3}s` }}
                  x1={x} y1={cond === "rain" ? 46 : 47} x2={x - 2} y2={cond === "rain" ? 53 : 49} />
              ))}
            </g>
          </>
        );
      case "snow":
        return (
          <>
            <Cloud y={-7} />
            <g fill="#e0f2fe">
              {[22, 32, 42].map((x, i) => (
                <circle key={x} className="wi-flake" style={{ animationDelay: `${i * 0.6}s` }} cx={x} cy={50} r="2.6" />
              ))}
            </g>
          </>
        );
      case "thunder":
        return (
          <>
            <Cloud y={-7} />
            <path className="wi-flash" d="M33 41l-6 10h6l-3 9 9-12h-6l4-7z" fill="#fde047" stroke="#fde047" strokeWidth="1.5" strokeLinejoin="round" />
          </>
        );
    }
  })();
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} role="img" aria-label={label} className="shrink-0 overflow-visible">
      <title>{label}</title>
      {body}
    </svg>
  );
}
