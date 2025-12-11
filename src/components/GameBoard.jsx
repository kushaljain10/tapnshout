import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import VictoryOverlay from "./VictoryOverlay";
import useResizeObserver from "../utils/useResizeObserver";
import { easeInOutCubic, lerp } from "../utils/easing";

export default function GameBoard() {
  const containerRef = useRef(null);
  const pathRef = useRef(null);
  const ballRef = useRef(null);

  const { width, height } = useResizeObserver(containerRef);

  const [winner, setWinner] = useState(null);
  const progressRef = useRef(0.5); // 0 = top end (P1), 1 = bottom end (P2)
  const velocityRef = useRef(0); // px per second along path length (signed)
  const targetVelocityRef = useRef(160); // base speed magnitude
  const directionRef = useRef(0); // -1 towards top, +1 towards bottom
  const easingStartRef = useRef(0);
  const animIdRef = useRef(null);
  const lastTsRef = useRef(0);
  const trailRef = useRef([]);

  const resetGame = useCallback(() => {
    setWinner(null);
    progressRef.current = 0.5;
    velocityRef.current = 0;
    directionRef.current = 0;
    easingStartRef.current = performance.now();
    trailRef.current = [];
  }, []);

  // Build a strictly symmetrical zigzag path with smooth curves across center line
  const pathD = useMemo(() => {
    const w = Math.max(1, width);
    const h = Math.max(1, height);
    const cx = w / 2;
    const topY = 12;
    const segmentsPerHalf = 5;
    const stepY = (h / 2 - topY) / segmentsPerHalf;
    const amplitude = Math.max(40, w * 0.28);

    // Top half: start at top center, alternate left/right, end at exact center
    const pointsTop = [];
    let y = topY;
    let dir = 1;
    pointsTop.push({ x: cx, y: topY });
    for (let i = 0; i < segmentsPerHalf; i++) {
      y += stepY;
      const x = cx + dir * amplitude;
      pointsTop.push({ x, y });
      dir *= -1;
    }
    pointsTop.push({ x: cx, y: h / 2 }); // center point

    // Bottom half: perfect mirror of top half across the center line
    const pointsBottom = [];
    for (let i = pointsTop.length - 1; i >= 0; i--) {
      // skip duplicating the center point
      if (i === pointsTop.length - 1) continue;
      const pt = pointsTop[i];
      pointsBottom.push({ x: pt.x, y: h - pt.y });
    }

    const points = [...pointsTop, ...pointsBottom];

    // convert points to smooth cubic path
    const d = [];
    d.push(`M ${points[0].x},${points[0].y}`);
    // Catmull–Rom to Bezier conversion for smooth, loop-free curves
    for (let i = 0; i < points.length - 1; i++) {
      const P0 = points[i - 1] || points[i];
      const P1 = points[i];
      const P2 = points[i + 1];
      const P3 = points[i + 2] || points[i + 1];

      const cp1x = P1.x + (P2.x - P0.x) / 6;
      const cp1y = P1.y + (P2.y - P0.y) / 6;
      const cp2x = P2.x - (P3.x - P1.x) / 6;
      const cp2y = P2.y - (P3.y - P1.y) / 6;

      d.push(`C ${cp1x},${cp1y} ${cp2x},${cp2y} ${P2.x},${P2.y}`);
    }
    return d.join(" ");
  }, [width, height]);

  // Animation loop
  useEffect(() => {
    const pathEl = pathRef.current;
    if (!pathEl) return;
    let running = true;
    const total = pathEl.getTotalLength();

    const tick = (ts) => {
      if (!running) return;
      if (!lastTsRef.current) lastTsRef.current = ts;
      const dt = (ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;

      // Ease velocity toward target based on direction
      const base = targetVelocityRef.current;
      const target = directionRef.current * base;
      const current = velocityRef.current;
      const elapsedEase = Math.min(1, (ts - easingStartRef.current) / 300);
      const eased = lerp(current, target, easeInOutCubic(elapsedEase));
      velocityRef.current = eased;

      // Advance along path by length units
      const deltaLen = velocityRef.current * dt;
      const progressDelta = deltaLen / total;
      let p = progressRef.current + progressDelta;
      // clamp and detect victory
      if (p <= 0) {
        p = 0;
        setWinner("Player 1");
        running = false;
      } else if (p >= 1) {
        p = 1;
        setWinner("Player 2");
        running = false;
      }
      progressRef.current = p;

      // Move ball to point on path
      const pos = pathEl.getPointAtLength(total * p);
      if (ballRef.current) {
        ballRef.current.setAttribute("cx", pos.x);
        ballRef.current.setAttribute("cy", pos.y);
      }

      // trail
      trailRef.current.push({ x: pos.x, y: pos.y, ts });
      if (trailRef.current.length > 25) trailRef.current.shift();

      animIdRef.current = requestAnimationFrame(tick);
    };

    animIdRef.current = requestAnimationFrame(tick);
    return () => {
      running = false;
      if (animIdRef.current) cancelAnimationFrame(animIdRef.current);
      animIdRef.current = null;
      lastTsRef.current = 0;
    };
  }, [pathD]);

  // Tap handlers
  const handleTap = useCallback(
    (clientY) => {
      if (winner) return;
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const isTop = clientY < rect.top + rect.height / 2;
      // Set direction (-1 top, +1 bottom), easing ramp
      directionRef.current = isTop ? -1 : 1;
      easingStartRef.current = performance.now();
    },
    [winner]
  );

  const onMouseDown = useCallback(
    (e) => {
      handleTap(e.clientY);
    },
    [handleTap]
  );

  const onTouchStart = useCallback(
    (e) => {
      const touch = e.changedTouches[0];
      if (touch) handleTap(touch.clientY);
    },
    [handleTap]
  );

  // Trail rendering
  const trailEls = useMemo(() => {
    const now = performance.now();
    const maxAge = 500;
    return trailRef.current
      .filter((p) => now - p.ts < maxAge)
      .map((p, i, arr) => {
        const age = now - p.ts;
        const t = 1 - age / maxAge;
        const r = 6 * t + 1;
        const opacity = Math.max(0, t * 0.6);
        return (
          <circle
            key={`trail-${i}`}
            className="trail-circle"
            cx={p.x}
            cy={p.y}
            r={r}
            fill={`rgba(255,255,255,${opacity})`}
          />
        );
      });
  }, [progressRef.current]);

  // Build the SVG and layers
  return (
    <div
      ref={containerRef}
      className="game-container"
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
    >
      <div className="half top" />
      <div className="half bottom" />
      <div className="center-line" />

      <svg
        className="svg-stage"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
      >
        <defs>
          <filter id="ballGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow
              dx="0"
              dy="2"
              stdDeviation="2"
              floodColor="#ffffff"
              floodOpacity="0.35"
            />
          </filter>
        </defs>
        {/* Path */}
        <path
          ref={pathRef}
          d={pathD}
          stroke="#fff"
          strokeWidth="3"
          fill="none"
          opacity="0.9"
        />
        {/* Trail */}
        {trailEls}
        {/* Ball (slightly larger) */}
        <circle
          ref={ballRef}
          className="ball"
          r="14"
          fill="var(--ball)"
          filter="url(#ballGlow)"
        />
      </svg>

      {/* Transparent zones to ensure taps register; logic uses global handlers */}
      <div className="tap-layer">
        <div className="tap-zone" />
        <div className="tap-zone" />
      </div>

      <VictoryOverlay winner={winner} onRestart={resetGame} />
    </div>
  );
}
