/** SVG rosary: crucifix + 4 pendant beads + 55-bead loop. See lib/steps.ts for indexes. */
const CX = 150, CY = 120, R = 100;

interface Pos { x: number; y: number; large: boolean }

const POSITIONS: Pos[] = (() => {
  const p: Pos[] = [
    { x: CX, y: 340, large: false }, // crucifix
    { x: CX, y: 306, large: true },
    { x: CX, y: 286, large: false },
    { x: CX, y: 270, large: false },
    { x: CX, y: 254, large: false },
  ];
  for (let k = 0; k < 55; k++) {
    const a = ((90 + ((k + 1) * 360) / 57) * Math.PI) / 180;
    p.push({ x: CX + R * Math.cos(a), y: CY + R * Math.sin(a), large: k % 11 === 0 });
  }
  return p;
})();

export function BeadRing({ current, className = "" }: { current: number; className?: string }) {
  return (
    <svg viewBox="0 0 300 360" className={className} role="img" aria-label={`Bead ${current + 1} of 60`}>
      <circle cx={CX} cy={CY} r={R} fill="none" className="stroke-border" strokeWidth={1.5} />
      <line x1={CX} y1={CY + R} x2={CX} y2={330} className="stroke-border" strokeWidth={1.5} />
      <rect x={CX - 7} y={CY + R + 4} width={14} height={14} rx={3} transform={`rotate(45 ${CX} ${CY + R + 11})`} className="fill-bead" />
      {POSITIONS.map((pos, i) => {
        const done = i < current;
        const now = i === current;
        const fill = done || now ? "fill-primary" : "fill-bead";
        if (i === 0) {
          return (
            <g key={i} className={fill}>
              <rect x={CX - 2.5} y={326} width={5} height={30} rx={1} />
              <rect x={CX - 10} y={334} width={20} height={5} rx={1} />
              {now && <circle cx={CX} cy={340} r={18} fill="none" className="stroke-primary" strokeWidth={2} />}
            </g>
          );
        }
        const r = pos.large ? 7.5 : 4.6;
        return (
          <g key={i}>
            <circle cx={pos.x} cy={pos.y} r={r} className={fill} />
            {now && <circle cx={pos.x} cy={pos.y} r={r + 5} fill="none" className="stroke-primary" strokeWidth={2} />}
          </g>
        );
      })}
    </svg>
  );
}
