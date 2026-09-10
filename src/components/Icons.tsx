import type { SVGProps } from "react";
type Props = SVGProps<SVGSVGElement>;
export function ExpandIcon(props: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      {...props}
    >
      <path d="M8 3H3v5m13-5h5v5M3 16v5h5m8 0h5v-5" />
    </svg>
  );
}
export function HomeIcon(props: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      {...props}
    >
      <path d="m3 10 9-7 9 7v10H3Z" />
      <path d="M9 20v-7h6v7" />
    </svg>
  );
}
export function ArrowIcon(props: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      {...props}
    >
      <path d="M5 19 19 5M5 5h14v14" />
    </svg>
  );
}
export function GearIcon(props: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      {...props}
    >
      <circle cx="12" cy="12" r="3" />
      <path d="m9 3-1 3-3 1-2 3 2 2-1 3 2 3 3-1 3 4 3-3 3 1 2-3-1-3 2-2-2-3-3-1-1-3Z" />
    </svg>
  );
}
export function LidIcon() {
  return (
    <svg viewBox="0 0 120 120" fill="none">
      <path
        className="ink-stroke"
        strokeWidth="4"
        strokeLinecap="round"
        d="M22 91h81M24 84l47-64M32 84h71"
      />
      <circle className="ink-stroke" cx="23" cy="88" r="7" strokeWidth="3" />
      <circle className="ink-fill" cx="23" cy="88" r="3" />
      <path
        className="red-stroke"
        d="M66 81a43 43 0 0 0-20-28"
        strokeWidth="2"
        strokeDasharray="5 4"
      />
    </svg>
  );
}
export function AccordionIcon() {
  return (
    <svg viewBox="0 0 120 120">
      <rect className="ink-fill" x="15" y="35" width="15" height="53" rx="4" />
      <path
        className="ink-fill"
        d="m34 28 8 5 8-5 8 5 8-5 8 5 8-5v64l-8-5-8 5-8-5-8 5-8-5-8 5Z"
      />
      <path
        className="paper-stroke"
        strokeWidth="1.5"
        d="M42 33v53m8-54v58m8-57v53m8-54v58m8-57v53"
      />
      <path className="red-fill" d="m86 33 11 2-4 53-11-2Z" />
      <rect className="ink-fill" x="96" y="35" width="12" height="53" rx="3" />
      {[45, 57, 69, 81].map((y) => (
        <g key={y} className="paper-fill">
          <circle cx="22" cy={y} r="2" />
          <circle cx="102" cy={y} r="2" />
        </g>
      ))}
    </svg>
  );
}
export function SleepIcon() {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="ink-stroke"
    >
      <path
        className="paper-fill"
        d="M15 83q-11-14 8-12 1-32 32-36 31-6 36 29 20-5 20 10 4 16-21 18l-57 4q-21 0-18-13Z"
      />
      <path d="M57 35q-8-23 3-23 12 0 6 10" />
      <path d="M31 61q1 12 12 6m12-7q7 9 14-1M30 87q10-13 24 0" />
      <ellipse className="ink-fill" cx="77" cy="87" rx="13" ry="10" />
      <ellipse className="ink-fill" cx="99" cy="83" rx="12" ry="12" />
    </svg>
  );
}
