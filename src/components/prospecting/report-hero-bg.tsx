// Animated deep-space backdrop for the report hero. Pure CSS (server-rendered,
// no JS): drifting nebulae with a slow hue shift, two parallax star layers, a
// couple of shooting stars and a vignette. All motion respects reduced-motion
// (the animate-* classes freeze via a media query in globals.css).

const STAR_LAYER_1 =
  "radial-gradient(1.4px 1.4px at 8% 18%, #fff, transparent), radial-gradient(1.2px 1.2px at 24% 62%, #cfefff, transparent), radial-gradient(1px 1px at 41% 28%, #fff, transparent), radial-gradient(1.5px 1.5px at 58% 74%, #bfe6ff, transparent), radial-gradient(1px 1px at 73% 40%, #fff, transparent), radial-gradient(1.3px 1.3px at 88% 22%, #eaf7ff, transparent), radial-gradient(1px 1px at 92% 66%, #fff, transparent), radial-gradient(1.2px 1.2px at 15% 84%, #fff, transparent)";
const STAR_LAYER_2 =
  "radial-gradient(1px 1px at 33% 12%, rgba(255,255,255,0.7), transparent), radial-gradient(1px 1px at 66% 20%, rgba(200,235,255,0.7), transparent), radial-gradient(1px 1px at 50% 52%, rgba(255,255,255,0.6), transparent), radial-gradient(1px 1px at 80% 84%, rgba(255,255,255,0.7), transparent), radial-gradient(1px 1px at 12% 46%, rgba(255,255,255,0.6), transparent)";

export function HeroBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Base deep-space gradient */}
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(120% 90% at 78% -10%, #1b3a56 0%, #142030 45%, #0b1520 100%)" }}
      />

      {/* Drifting nebulae (colour shifts slowly via hue-rotate) */}
      <div className="animate-nebula-hue absolute inset-0" style={{ filter: "blur(60px)" }}>
        <div
          className="animate-nebula-a absolute -left-[10%] top-[-20%] h-[70%] w-[60%] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(0,181,226,0.32), transparent 62%)" }}
        />
        <div
          className="animate-nebula-b absolute right-[-15%] top-[10%] h-[80%] w-[65%] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(56,120,190,0.3), transparent 62%)" }}
        />
        <div
          className="animate-nebula-a absolute bottom-[-25%] left-[20%] h-[70%] w-[70%] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(120,80,200,0.2), transparent 65%)", animationDelay: "-12s" }}
        />
      </div>

      {/* Parallax star layers */}
      <div
        className="animate-star-drift absolute inset-[-10%] opacity-80"
        style={{ backgroundImage: STAR_LAYER_1 }}
      />
      <div
        className="animate-star-drift absolute inset-[-10%] opacity-70"
        style={{ backgroundImage: STAR_LAYER_2, animationDuration: "140s" }}
      />

      {/* Shooting stars — start bottom-right, streak to the top-left */}
      <span
        className="animate-shooting absolute left-[78%] top-[82%] h-px w-28"
        style={{ background: "linear-gradient(90deg, rgba(255,255,255,0.95), transparent)" }}
      />
      <span
        className="animate-shooting absolute left-[92%] top-[62%] h-px w-20"
        style={{ background: "linear-gradient(90deg, rgba(180,225,255,0.95), transparent)", animationDelay: "-5.5s" }}
      />

      {/* Vignette for depth/focus */}
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(120% 80% at 50% 40%, transparent 55%, rgba(6,12,20,0.6) 100%)" }}
      />
    </div>
  );
}
