import React from 'react';
import { AbsoluteFill, Easing, Img, interpolate, random, staticFile, useCurrentFrame } from 'remotion';

// 10s @ 30fps. Frame 0 == frame 300: every motion is either periodic over LOOP_FRAMES or zero at both ends.
export const LOOP_FRAMES = 300;

const W = 1080;
const C = W / 2;
const S = 540; // emblem size on canvas
const R = S / 2;
const G = 10; // grid -> fine shards (2*G*G triangles minus transparent corners)
const EMBLEM = staticFile('haux-emblem.png');

const BG = '#060A08';
const DEEP = '#0B3A1F';
const BRAND = '#2DBE60';
const NEON = '#7EE8A8';

// Timeline (frames)
const CRACK_IN = 40;
const SPLIT = 62; // shards start to separate
const RETURN = 160; // shards start to return
const WELD = 262; // fully reassembled

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const smooth = Easing.inOut(Easing.cubic);

type Frag = {
  pts: [number, number][];
  minX: number; minY: number; w: number; h: number; cx: number; cy: number;
  dx: number; dy: number; dz: number; rx: number; ry: number; rz: number;
  delayOut: number; delayIn: number; phase: number;
};

// ---- Shard geometry: jittered grid split into triangles ----
const cell = S / G;
const vert = (i: number, j: number): [number, number] => {
  const inner = i > 0 && j > 0 && i < G && j < G;
  const jx = inner ? (random(`vx${i}-${j}`) - 0.5) * cell * 0.55 : 0;
  const jy = inner ? (random(`vy${i}-${j}`) - 0.5) * cell * 0.55 : 0;
  return [i * cell + jx, j * cell + jy];
};

const FRAGS: Frag[] = [];
for (let i = 0; i < G; i++) {
  for (let j = 0; j < G; j++) {
    const a = vert(i, j), b = vert(i + 1, j), c = vert(i + 1, j + 1), d = vert(i, j + 1);
    const tris: [number, number][][] = (i + j) % 2 ? [[a, b, c], [a, c, d]] : [[a, b, d], [b, c, d]];
    for (const pts of tris) {
      if (pts.every(([x, y]) => Math.hypot(x - R, y - R) > R * 0.97)) continue; // transparent corner
      const k = FRAGS.length;
      const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
      const minX = Math.min(...xs), minY = Math.min(...ys);
      const cx = (xs[0] + xs[1] + xs[2]) / 3, cy = (ys[0] + ys[1] + ys[2]) / 3;
      const vx = cx - R, vy = cy - R;
      const dist = Math.hypot(vx, vy) || 1;
      const rel = dist / R;
      // contained separation: outer shards drift a little further, nothing flies off
      const push = 6 + rel * 24 + random(`p${k}`) * 8;
      FRAGS.push({
        pts, minX, minY, w: Math.max(...xs) - minX, h: Math.max(...ys) - minY, cx, cy,
        dx: (vx / dist) * push,
        dy: (vy / dist) * push,
        dz: 10 + random(`z${k}`) * 90 * (0.4 + rel),
        rx: (random(`rx${k}`) - 0.5) * 16,
        ry: (random(`ry${k}`) - 0.5) * 16,
        rz: (random(`rz${k}`) - 0.5) * 5,
        delayOut: rel * 22,
        delayIn: rel * 28, // trunk first, canopy edge last
        phase: random(`ph${k}`),
      });
    }
  }
}

const fragOffset = (f: number, fr: Frag) => {
  const out = interpolate(f, [SPLIT + fr.delayOut, SPLIT + fr.delayOut + 60], [0, 1], { ...clamp, easing: smooth });
  const back = interpolate(f, [RETURN + fr.delayIn, RETURN + fr.delayIn + 72], [0, 1], { ...clamp, easing: smooth });
  return out * (1 - back);
};

const Fragment: React.FC<{ fr: Frag; f: number }> = ({ fr, f }) => {
  const o = fragOffset(f, fr);
  const drift = Math.sin(2 * Math.PI * (f / 150 + fr.phase)) * 4 * o;
  const clip = fr.pts.map(([x, y]) => `${(x - fr.minX).toFixed(2)}px ${(y - fr.minY).toFixed(2)}px`).join(',');
  return (
    <div
      style={{
        position: 'absolute', left: fr.minX, top: fr.minY, width: fr.w, height: fr.h,
        backgroundImage: `url(${EMBLEM})`, backgroundSize: `${S}px ${S}px`,
        backgroundPosition: `${-fr.minX}px ${-fr.minY}px`,
        clipPath: `polygon(${clip})`,
        transformOrigin: `${fr.cx - fr.minX}px ${fr.cy - fr.minY}px`,
        transform: `translate3d(${fr.dx * o}px, ${fr.dy * o + drift}px, ${fr.dz * o}px) rotateX(${fr.rx * o}deg) rotateY(${fr.ry * o}deg) rotateZ(${fr.rz * o}deg)`,
        // faint edge-light as a shard tilts toward the camera
        filter: `brightness(${1.06 + 0.22 * o * (0.5 + 0.5 * Math.sin(fr.phase * 6.28))})`,
      }}
    />
  );
};

// ---- Gears: thin line-art, all on one module so they truly mesh ----
const MOD = 11; // pitch radius = MOD * teeth / 2
const rp = (n: number) => (MOD * n) / 2;
const gearPath = (n: number) => {
  const r = rp(n), T = (2 * Math.PI) / n, ro = r + MOD * 0.8, rr = r - MOD * 0.95;
  const pt = (rad: number, ang: number) => `${(rad * Math.cos(ang)).toFixed(2)},${(rad * Math.sin(ang)).toFixed(2)}`;
  const p: string[] = [];
  for (let k = 0; k < n; k++) {
    const a = k * T;
    p.push(pt(rr, a - 0.5 * T), pt(rr, a - 0.26 * T), pt(ro, a - 0.12 * T), pt(ro, a + 0.12 * T), pt(rr, a + 0.26 * T));
  }
  return `M${p.join('L')}Z`;
};
type GearSpec = { n: number; x: number; y: number; rot: (a: number) => number; spokes: number };
// Gear meshed with a driver at direction theta: tooth meets gap at the contact point.
const meshed = (n1: number, n2: number, theta: number, driver: (a: number) => number) => (a: number) =>
  -(n1 / n2) * (driver(a) - theta) + theta + 180 + 180 / n2;
const at = (x: number, y: number, dist: number, theta: number) => ({
  x: x + dist * Math.cos((theta * Math.PI) / 180),
  y: y + dist * Math.sin((theta * Math.PI) / 180),
});

const RING = 56;
const ringRot = (a: number) => a;
const A = { n: 22, theta: -38 }, B = { n: 16, theta: 146 }, T = { n: 12, theta: -112 };
const posA = at(C, C, rp(RING) + rp(A.n), A.theta);
const rotA = meshed(RING, A.n, A.theta, ringRot);
const GEARS: GearSpec[] = [
  { n: RING, x: C, y: C, rot: ringRot, spokes: 8 },
  { n: A.n, ...posA, rot: rotA, spokes: 6 },
  { n: B.n, ...at(C, C, rp(RING) + rp(B.n), B.theta), rot: meshed(RING, B.n, B.theta, ringRot), spokes: 5 },
  { n: T.n, ...at(posA.x, posA.y, rp(A.n) + rp(T.n), T.theta), rot: meshed(A.n, T.n, T.theta, rotA), spokes: 4 },
];
// Ring advances exactly 3 teeth per loop; every meshed gear then also advances a whole number of teeth -> seamless loop.
const GEAR_TURN = (3 * 360) / RING;

const Gear: React.FC<{ g: GearSpec; angle: number }> = ({ g, angle }) => {
  const r = rp(g.n);
  const rim = r - MOD * 2.1;
  const hub = Math.max(10, r * 0.14);
  return (
    <g transform={`translate(${g.x.toFixed(2)} ${g.y.toFixed(2)}) rotate(${g.rot(angle).toFixed(3)})`} fill="none" strokeLinejoin="round">
      <path d={gearPath(g.n)} stroke={BRAND} strokeWidth={1.3} strokeOpacity={0.75} fill="rgba(11,58,31,0.18)" />
      <circle r={rim} stroke={BRAND} strokeWidth={1} strokeOpacity={0.55} />
      <circle r={rim - 6} stroke={NEON} strokeWidth={0.6} strokeOpacity={0.3} strokeDasharray="2 6" />
      {Array.from({ length: g.spokes }, (_, k) => {
        const a = ((360 / g.spokes) * k * Math.PI) / 180;
        return <line key={k} x1={hub * Math.cos(a)} y1={hub * Math.sin(a)} x2={(rim - 6) * Math.cos(a)} y2={(rim - 6) * Math.sin(a)}
          stroke={BRAND} strokeWidth={1} strokeOpacity={0.5} />;
      })}
      <circle r={hub} stroke={NEON} strokeWidth={1.1} strokeOpacity={0.6} />
      <circle r={hub * 0.4} stroke={NEON} strokeWidth={0.8} strokeOpacity={0.5} />
    </g>
  );
};

// ---- Background circuit traces ----
const TRACES: [string, [number, number]][] = [
  ['M0,170 H170 L230,230 H330', [330, 230]],
  ['M0,880 H130 L190,820 V740', [190, 740]],
  ['M1080,210 H930 L870,150 V40', [870, 40]],
  ['M1080,910 H960 L900,970 H760', [760, 970]],
  ['M250,1080 V980 L300,930 H380', [380, 930]],
  ['M60,0 V80 L110,130 V280', [110, 280]],
];

const PARTICLES = Array.from({ length: 28 }, (_, k) => ({
  x: random(`px${k}`) * W, y: random(`py${k}`) * W, s: 0.8 + random(`ps${k}`) * 1.6, p: random(`pp${k}`),
}));

export const HeroLoop: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / LOOP_FRAMES;
  const wave = Math.sin(2 * Math.PI * t);

  const open = interpolate(f, [SPLIT, SPLIT + 70, RETURN + 10, WELD], [0, 1, 1, 0], { ...clamp, easing: smooth });
  // slow parallax of the whole tree; both terms are 0 at f=0 and f=LOOP_FRAMES
  const camY = 9 * wave + 6 * open;
  const camX = 3 * Math.sin(4 * Math.PI * t) + 4 * open;
  const showFrags = f > SPLIT && f < WELD + 28;

  const crack =
    interpolate(f, [CRACK_IN, SPLIT, SPLIT + 30], [0, 0.85, 0], { ...clamp, easing: smooth }) +
    interpolate(f, [WELD - 30, WELD - 4, WELD + 26], [0, 0.7, 0], { ...clamp, easing: smooth });

  const gearAngle = GEAR_TURN * t; // constant, slow, mechanical
  const gearOpacity = 0.32 + 0.38 * open;

  const glow = 0.22 + 0.04 * wave + 0.1 * open + 0.12 * interpolate(f, [WELD - 20, WELD, WELD + 36], [0, 1, 0], { ...clamp, easing: smooth });
  const weld = interpolate(f, [WELD - 6, WELD + 40], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });

  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 50%, ${DEEP} 0%, #08190F 40%, ${BG} 74%)`, overflow: 'hidden' }}>
      <svg width={W} height={W} style={{ position: 'absolute', inset: 0 }}>
        {TRACES.map(([d, end], k) => (
          <g key={k}>
            <path d={d} fill="none" stroke={BRAND} strokeOpacity={0.1} strokeWidth={1.5} />
            <path d={d} pathLength={1000} fill="none" stroke={NEON} strokeOpacity={0.35} strokeWidth={1.6} strokeLinecap="round"
              strokeDasharray="60 940" strokeDashoffset={1000 - (((t + k * 0.29) % 1) * 1000)} />
            <circle cx={end[0]} cy={end[1]} r={3.5} fill={BG} stroke={BRAND} strokeOpacity={0.35} strokeWidth={1.4} />
          </g>
        ))}
        {PARTICLES.map((p, k) => (
          <circle key={k} cx={p.x + 10 * Math.sin(2 * Math.PI * (t + p.p))} cy={p.y + 14 * Math.cos(2 * Math.PI * (t + p.p * 1.7))}
            r={p.s} fill={NEON} opacity={0.05 + 0.18 * (0.5 + 0.5 * Math.sin(2 * Math.PI * (2 * t + p.p)))} />
        ))}
      </svg>

      <div style={{ position: 'absolute', left: C - 460, top: C - 460, width: 920, height: 920, borderRadius: '50%',
        background: `radial-gradient(circle, rgba(45,190,96,${glow}) 0%, rgba(45,190,96,${glow * 0.3}) 38%, rgba(45,190,96,0) 68%)` }} />

      <AbsoluteFill style={{ perspective: 1800, perspectiveOrigin: '50% 48%' }}>
        <AbsoluteFill style={{ transformStyle: 'preserve-3d', transform: `rotateX(${camX}deg) rotateY(${camY}deg)` }}>
          <svg width={W} height={W} style={{ position: 'absolute', inset: 0, overflow: 'visible', opacity: gearOpacity,
            transform: 'translateZ(-140px)', filter: 'drop-shadow(0 0 6px rgba(45,190,96,0.35))' }}>
            {GEARS.map((g, k) => <Gear key={k} g={g} angle={gearAngle} />)}
          </svg>

          <div style={{ position: 'absolute', left: C - R, top: C - R, width: S, height: S, transformStyle: 'preserve-3d' }}>
            {showFrags ? (
              FRAGS.map((fr, k) => <Fragment key={k} fr={fr} f={f} />)
            ) : (
              <Img src={EMBLEM} style={{ width: S, height: S, display: 'block', filter: 'brightness(1.06)' }} />
            )}
            {crack > 0.001 && (
              <svg width={S} height={S} style={{ position: 'absolute', inset: 0, opacity: Math.min(1, crack), filter: 'drop-shadow(0 0 3px rgba(126,232,168,0.8))' }}>
                <defs><clipPath id="disc"><circle cx={R} cy={R} r={R * 0.95} /></clipPath></defs>
                <g clipPath="url(#disc)" fill="none" stroke={NEON} strokeWidth={0.7} strokeOpacity={0.5}>
                  {FRAGS.map((fr, k) => <polygon key={k} points={fr.pts.map((p) => p.join(',')).join(' ')} />)}
                </g>
              </svg>
            )}
          </div>
        </AbsoluteFill>
      </AbsoluteFill>

      {weld > 0 && weld < 1 && (
        <div style={{ position: 'absolute', left: C - (R + 60 * weld), top: C - (R + 60 * weld), width: 2 * (R + 60 * weld), height: 2 * (R + 60 * weld),
          borderRadius: '50%', border: `1px solid rgba(126,232,168,${0.35 * (1 - weld)})` }} />
      )}

      <AbsoluteFill style={{ background: 'radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.5) 100%)' }} />
    </AbsoluteFill>
  );
};
