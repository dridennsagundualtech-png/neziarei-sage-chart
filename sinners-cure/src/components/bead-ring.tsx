/** SVG rosary: crucifix + 4 pendant beads + medal + 55-bead loop. See lib/steps.ts for indexes. */
const CX = 150,
  CY = 132,
  R = 112;
const JUNCTION = CY + R + 4;

interface Pos {
  x: number;
  y: number;
  large: boolean;
}

const POSITIONS: Pos[] = (() => {
  const p: Pos[] = [
    { x: CX, y: 352, large: false }, // crucifix
    { x: CX, y: 314, large: true },
    { x: CX, y: 296, large: false },
    { x: CX, y: 282, large: false },
    { x: CX, y: 268, large: false },
  ];
  for (let k = 0; k < 55; k++) {
    const a = ((90 + ((k + 1) * 360) / 57) * Math.PI) / 180;
    p.push({ x: CX + R * Math.cos(a), y: CY + R * Math.sin(a), large: k % 11 === 0 });
  }
  return p;
})();

export function BeadRing({ current, className = "" }: { current: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 300 384"
      className={className}
      role="img"
      aria-label={current >= 0 ? `Bead ${current + 1} of 60` : "Rosary"}
    >
      <circle cx={CX} cy={CY} r={R} fill="none" className="stroke-bead" strokeWidth={1.25} />
      <line x1={CX} y1={JUNCTION} x2={CX} y2={338} className="stroke-bead" strokeWidth={1.25} />
      {/* medal where the loop meets the pendant */}
      <ellipse
        cx={CX}
        cy={JUNCTION + 6}
        rx={8}
        ry={10}
        className={current >= 5 ? "fill-primary" : "fill-bead"}
      />
      {POSITIONS.map((pos, i) => {
        const done = i < current;
        const now = i === current;
        const fill = now ? "fill-primary" : done ? "fill-primary opacity-45" : "fill-bead";
        if (i === 0) {
          return (
            <g key={i} className={now || done ? "fill-primary" : "fill-bead"}>
              <rect x={CX - 3} y={338} width={6} height={38} rx={1.5} />
              <rect x={CX - 12} y={348} width={24} height={6} rx={1.5} />
              {now && (
                <circle
                  cx={CX}
                  cy={356}
                  r={24}
                  fill="none"
                  className="stroke-primary"
                  strokeWidth={2}
                />
              )}
            </g>
          );
        }
        const r = pos.large ? 8 : 5.2;
        return (
          <g key={i}>
            <circle cx={pos.x} cy={pos.y} r={r} className={`${fill} ${now ? "bead-pop" : ""}`} />
            {now && (
              <circle
                cx={pos.x}
                cy={pos.y}
                r={r + 5.5}
                fill="none"
                className="stroke-primary"
                strokeWidth={2}
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}
