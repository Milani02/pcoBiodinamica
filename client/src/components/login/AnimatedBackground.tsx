import { useRef, type PointerEvent } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";

const blobs = [
  { className: "bg-[#4d590d]", size: 620, top: "-12%", left: "-8%", duration: 26, depth: 18 },
  { className: "bg-[#a3b93a]", size: 520, top: "38%", left: "62%", duration: 32, depth: 30 },
  { className: "bg-[#949b6e]", size: 460, top: "62%", left: "4%", duration: 22, depth: 12 },
  { className: "bg-[#6c7a1f]", size: 380, top: "4%", left: "58%", duration: 29, depth: 24 },
];

export function AnimatedBackground() {
  const reduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const springX = useSpring(pointerX, { stiffness: 40, damping: 20 });
  const springY = useSpring(pointerY, { stiffness: 40, damping: 20 });

  function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
    if (reduceMotion || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    pointerX.set(((e.clientX - rect.left) / rect.width - 0.5) * 2);
    pointerY.set(((e.clientY - rect.top) / rect.height - 0.5) * 2);
  }

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      className="absolute inset-0 overflow-hidden bg-[#f2f0e6] dark:bg-[#0a0b07]"
      aria-hidden="true"
    >
      {blobs.map((blob, i) => (
        <Blob key={i} blob={blob} pointerX={springX} pointerY={springY} reduceMotion={Boolean(reduceMotion)} />
      ))}

      <div
        className="absolute inset-0 opacity-[0.05] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/15 dark:from-black/10 dark:to-black/50" />
    </div>
  );
}

function Blob({
  blob,
  pointerX,
  pointerY,
  reduceMotion,
}: {
  blob: (typeof blobs)[number];
  pointerX: ReturnType<typeof useSpring>;
  pointerY: ReturnType<typeof useSpring>;
  reduceMotion: boolean;
}) {
  const x = useTransform(pointerX, (v) => v * blob.depth);
  const y = useTransform(pointerY, (v) => v * blob.depth);

  return (
    <motion.div
      className={`absolute rounded-full blur-[90px] ${blob.className}`}
      style={{
        width: blob.size,
        height: blob.size,
        top: blob.top,
        left: blob.left,
        x,
        y,
        opacity: 0.55,
      }}
      animate={
        reduceMotion
          ? {}
          : {
              scale: [1, 1.12, 0.96, 1],
              rotate: [0, 12, -8, 0],
            }
      }
      transition={{
        duration: blob.duration,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}
