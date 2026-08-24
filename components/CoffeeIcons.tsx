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

export function BeanIcon() {
  return (
    <Icon>
      <ellipse cx="12" cy="12" rx="6.5" ry="9" />
      <path d="M12 4.5c1.8 2.4 2.2 5.2 0 7.5s-1.8 5.1 0 7.5" />
    </Icon>
  );
}

export function BookIcon() {
  return (
    <Icon>
      <path d="M4 5.5c2.2-1 4.4-1 7 0v13c-2.6-1-4.8-1-7 0z" />
      <path d="M20 5.5c-2.2-1-4.4-1-7 0v13c2.6-1 4.8-1 7 0z" />
      <path d="M12 5.5v13" />
    </Icon>
  );
}

export function ProcessIcon() {
  return (
    <Icon>
      <path d="M8 4.5c3 0 3 4 6 4s3-4 6-4" />
      <path d="M8 12c3 0 3 4 6 4s3-4 6-4" />
      <path d="M8 19.5c3 0 3-4 6-4s3 4 6 4" />
    </Icon>
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

export function AltitudeIcon() {
  return (
    <Icon>
      <path d="M12 19V6.5" />
      <path d="M8 10.5 12 6.5 16 10.5" />
      <path d="M6 19h12" />
    </Icon>
  );
}

export function NoteIcon() {
  return (
    <Icon>
      <path d="M9 18.5a2.5 2.5 0 1 1-2.2-2.48" />
      <path d="M16.5 16a2.5 2.5 0 1 1-2.2-2.48" />
      <path d="M11.5 16V6.5l7.5-1.5V13" />
    </Icon>
  );
}

export function VarietyIcon() {
  return (
    <Icon>
      <path d="M8 20V9" />
      <path d="M16 20V9" />
      <path d="M8 11c0-3 2-5.5 4-6.5 2 1 4 3.5 4 6.5" />
      <path d="M5.5 13.5c1.5.8 3.2.8 4.5 0" />
      <path d="M14 13.5c1.3.8 3 .8 4.5 0" />
    </Icon>
  );
}
