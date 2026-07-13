// Static SVG globe for the report hero. Pure server-rendered markup — no
// WebGL, no client JS — so it always renders identically and never "bugs out".
// An orthographic projection places the marker at the property's real
// coordinates over an Atlantic-facing wireframe sphere.

const R = 168;
const CX = 200;
const CY = 200;
const LAT0 = 20; // view centre latitude
const LON0 = -24; // view centre longitude (Atlantic) → Iberia sits upper-right

function rad(d: number): number {
  return (d * Math.PI) / 180;
}

/** Orthographic projection of lat/lng onto the visible hemisphere. */
function project(lat: number, lng: number): { x: number; y: number; visible: boolean } {
  const dLon = rad(lng - LON0);
  const la = rad(lat);
  const la0 = rad(LAT0);
  const cosC = Math.sin(la0) * Math.sin(la) + Math.cos(la0) * Math.cos(la) * Math.cos(dLon);
  const x = R * Math.cos(la) * Math.sin(dLon);
  const y = R * (Math.cos(la0) * Math.sin(la) - Math.sin(la0) * Math.cos(la) * Math.cos(dLon));
  return { x: CX + x, y: CY - y, visible: cosC >= 0 };
}

export function ReportGlobe({
  lat,
  lng,
  place,
}: {
  lat: number;
  lng: number;
  place: string;
}) {
  const m = project(lat, lng);
  // Meridian ellipses (longitude) and parallel chords (latitude).
  const meridians = [30, 60].map((a) => R * Math.cos(rad(a)));
  const parallels = [30, 60].map((a) => ({ dy: R * Math.sin(rad(a)), w: R * Math.cos(rad(a)) }));

  // Label anchoring — flip the chip to the left if the marker is near the edge.
  const labelRight = m.x < CX + 60;

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[460px]">
      {/* Atmosphere glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-[4%] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle at 50% 42%, rgba(0,181,226,0.45), transparent 62%)" }}
      />
      <svg viewBox="0 0 400 400" className="relative h-full w-full" role="img" aria-label={`Localização: ${place}`}>
        <defs>
          <radialGradient id="ocean" cx="38%" cy="32%" r="75%">
            <stop offset="0%" stopColor="#2f6c9c" />
            <stop offset="55%" stopColor="#1b3a55" />
            <stop offset="100%" stopColor="#0b1826" />
          </radialGradient>
          <radialGradient id="shade" cx="68%" cy="72%" r="70%">
            <stop offset="0%" stopColor="#000000" stopOpacity="0.55" />
            <stop offset="60%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="atmo" cx="50%" cy="50%" r="50%">
            <stop offset="82%" stopColor="#00B5E2" stopOpacity="0" />
            <stop offset="100%" stopColor="#00B5E2" stopOpacity="0.35" />
          </radialGradient>
          <clipPath id="sphere">
            <circle cx={CX} cy={CY} r={R} />
          </clipPath>
        </defs>

        {/* Outer atmosphere ring */}
        <circle cx={CX} cy={CY} r={R + 10} fill="url(#atmo)" />

        {/* Sphere */}
        <circle cx={CX} cy={CY} r={R} fill="url(#ocean)" />

        {/* Graticule */}
        <g clipPath="url(#sphere)" fill="none" stroke="#8fd6ef" strokeOpacity="0.22" strokeWidth="1">
          <line x1={CX} y1={CY - R} x2={CX} y2={CY + R} />
          {meridians.map((rx, i) => (
            <ellipse key={`m${i}`} cx={CX} cy={CY} rx={rx} ry={R} />
          ))}
          <line x1={CX - R} y1={CY} x2={CX + R} y2={CY} />
          {parallels.map((p, i) => (
            <g key={`p${i}`}>
              <line x1={CX - p.w} y1={CY - p.dy} x2={CX + p.w} y2={CY - p.dy} />
              <line x1={CX - p.w} y1={CY + p.dy} x2={CX + p.w} y2={CY + p.dy} />
            </g>
          ))}
        </g>

        {/* Day/night shading for depth + specular highlight */}
        <circle cx={CX} cy={CY} r={R} fill="url(#shade)" />
        <ellipse cx={CX - 52} cy={CY - 64} rx={46} ry={30} fill="#ffffff" opacity="0.08" />

        {/* Rim light */}
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="#bfe9f7" strokeOpacity="0.25" strokeWidth="1.5" />

        {/* Marker */}
        {m.visible && (
          <g>
            <circle cx={m.x} cy={m.y} r="5" fill="#00B5E2" fillOpacity="0.35">
              <animate attributeName="r" values="5;18;5" dur="2.4s" repeatCount="indefinite" />
              <animate attributeName="fill-opacity" values="0.35;0;0.35" dur="2.4s" repeatCount="indefinite" />
            </circle>
            <circle cx={m.x} cy={m.y} r="5.5" fill="#00B5E2" stroke="#ffffff" strokeWidth="2" />
          </g>
        )}
      </svg>

      {/* Location chip anchored to the marker */}
      {m.visible && (
        <div
          className="pointer-events-none absolute"
          style={{
            left: `${(m.x / 400) * 100}%`,
            top: `${(m.y / 400) * 100}%`,
            transform: `translate(${labelRight ? "12px" : "calc(-100% - 12px)"}, -50%)`,
          }}
        >
          <span
            className="whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-semibold text-white backdrop-blur"
            style={{ background: "rgba(0,181,226,0.18)", border: "1px solid rgba(0,181,226,0.5)" }}
          >
            {place}
          </span>
        </div>
      )}
    </div>
  );
}
