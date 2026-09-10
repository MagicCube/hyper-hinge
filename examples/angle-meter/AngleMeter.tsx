import { useHinge } from "../../src/hinge";
// Copy into src/apps/your-app; adjust the import to ../../hinge.
export function AngleMeter() {
  const { angle, velocity, available, source } = useHinge();
  if (!available) return <p>Sensor unavailable. Turn on Simulate below.</p>;
  return (
    <div>
      <h2>ANGLE METER</h2>
      <p>
        {angle.toFixed(1)}° · {velocity.toFixed(1)}°/s
      </p>
      <p>{source === "simulation" ? "Simulated input" : "Live sensor"}</p>
    </div>
  );
}
