import { useEffect, useState } from "react";
import { hinge, useHinge } from "../hinge";
export function MotionWidget() {
  const lid = useHinge();
  const [samples, setSamples] = useState<number[]>(Array(23).fill(0));
  useEffect(() => {
    const timer = setInterval(() => {
      const current = hinge.getSnapshot();
      setSamples((previous) => [
        ...previous.slice(1),
        current.available ? current.velocity : 0,
      ]);
    }, 100);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="motion-widget">
      <span>MOTION</span>
      <div className="motion-visual" aria-label="Recent measured motion">
        {samples.map((value, i) => (
          <i
            key={i}
            style={{ height: `${5 + Math.min(Math.abs(value) * 2, 80)}px` }}
          />
        ))}
      </div>
      <div className="widget-bottom">
        <strong>{lid.direction}</strong>
        <span>{Math.abs(lid.velocity).toFixed(0)}°/s</span>
      </div>
    </div>
  );
}
