type IconProps = {
  className?: string;
};

export function FilterIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M5 7.25h14M8.5 12h7M11 16.75h2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ChevronRightIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="m9 5 7 7-7 7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CameraIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M8.75 7.25 10 5.75h4l1.25 1.5H18a1.75 1.75 0 0 1 1.75 1.75v7.25A1.75 1.75 0 0 1 18 18H6A1.75 1.75 0 0 1 4.25 16.25V9A1.75 1.75 0 0 1 6 7.25h2.75Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12.25" r="2.75" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function CameraPlusIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M8.75 7.25 10 5.75h4l1.25 1.5H18a1.75 1.75 0 0 1 1.75 1.75v7.25A1.75 1.75 0 0 1 18 18H6A1.75 1.75 0 0 1 4.25 16.25V9A1.75 1.75 0 0 1 6 7.25h2.75Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="10.75" cy="12.25" r="2.75" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M17.25 9.5v4M15.25 11.5h4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CalendarIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M7.25 4.75v2.5M16.75 4.75v2.5M5.75 8.25h12.5M7 19.25h10a1.25 1.25 0 0 0 1.25-1.25V7.75A1.25 1.25 0 0 0 17 6.5H7A1.25 1.25 0 0 0 5.75 7.75V18A1.25 1.25 0 0 0 7 19.25Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
