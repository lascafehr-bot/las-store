import type { ReactNode } from "react";

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="mt-0.5 h-5 w-5 shrink-0 stroke-current text-las-primary"
      fill="none"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function PinIcon() {
  return (
    <Icon>
      <path d="M12 21s-6.5-5.2-6.5-10A6.5 6.5 0 0 1 12 4.5 6.5 6.5 0 0 1 18.5 11c0 4.8-6.5 10-6.5 10z" />
      <circle cx="12" cy="11" r="2.2" />
    </Icon>
  );
}
