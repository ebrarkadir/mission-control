import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & {
  size?: number | string;
};

const defaultProps = {
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export function IconDashboard({ size, ...props }: IconProps) {
  return (
    <svg {...defaultProps} width={size ?? 16} height={size ?? 16} {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

export function IconVehicles({ size, ...props }: IconProps) {
  return (
    <svg {...defaultProps} width={size ?? 16} height={size ?? 16} {...props}>
      <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
    </svg>
  );
}

export function IconMissions({ size, ...props }: IconProps) {
  return (
    <svg {...defaultProps} width={size ?? 16} height={size ?? 16} {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="5" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="2" y1="12" x2="5" y2="12" />
      <line x1="19" y1="12" x2="22" y2="12" />
    </svg>
  );
}

export function IconTelemetry({ size, ...props }: IconProps) {
  return (
    <svg {...defaultProps} width={size ?? 16} height={size ?? 16} {...props}>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

export function IconAlerts({ size, ...props }: IconProps) {
  return (
    <svg {...defaultProps} width={size ?? 16} height={size ?? 16} {...props}>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

export function IconNotifications({ size, ...props }: IconProps) {
  return (
    <svg {...defaultProps} width={size ?? 16} height={size ?? 16} {...props}>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

export function IconUser({ size, ...props }: IconProps) {
  return (
    <svg {...defaultProps} width={size ?? 16} height={size ?? 16} {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M20 21a8 8 0 0 0-16 0" />
    </svg>
  );
}

export function IconLogout({ size, ...props }: IconProps) {
  return (
    <svg {...defaultProps} width={size ?? 16} height={size ?? 16} {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

export function IconRefresh({ size, ...props }: IconProps) {
  return (
    <svg {...defaultProps} width={size ?? 16} height={size ?? 16} {...props}>
      <path d="M21.5 2v6h-6" />
      <path d="M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.19" />
    </svg>
  );
}

export function IconPlus({ size, ...props }: IconProps) {
  return (
    <svg {...defaultProps} width={size ?? 16} height={size ?? 16} {...props}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export function IconCheck({ size, ...props }: IconProps) {
  return (
    <svg {...defaultProps} width={size ?? 16} height={size ?? 16} {...props}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function IconClose({ size, ...props }: IconProps) {
  return (
    <svg {...defaultProps} width={size ?? 16} height={size ?? 16} {...props}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function IconBattery({ size, ...props }: IconProps) {
  return (
    <svg {...defaultProps} width={size ?? 16} height={size ?? 16} {...props}>
      <rect x="2" y="7" width="16" height="10" rx="2" />
      <line x1="22" y1="11" x2="22" y2="13" />
    </svg>
  );
}

export function IconThermometer({ size, ...props }: IconProps) {
  return (
    <svg {...defaultProps} width={size ?? 16} height={size ?? 16} {...props}>
      <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
    </svg>
  );
}

export function IconGauge({ size, ...props }: IconProps) {
  return (
    <svg {...defaultProps} width={size ?? 16} height={size ?? 16} {...props}>
      <path d="m12 14 3-3" />
      <path d="M3.34 19a10 10 0 1 1 17.32 0" />
    </svg>
  );
}

export function IconAltitude({ size, ...props }: IconProps) {
  return (
    <svg {...defaultProps} width={size ?? 16} height={size ?? 16} {...props}>
      <path d="m8 3 4 8 5-5 5 11H2z" />
    </svg>
  );
}

export function IconCoordinates({ size, ...props }: IconProps) {
  return (
    <svg {...defaultProps} width={size ?? 16} height={size ?? 16} {...props}>
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
}

export function IconRadio({ size, ...props }: IconProps) {
  return (
    <svg {...defaultProps} width={size ?? 16} height={size ?? 16} {...props}>
      <circle cx="12" cy="12" r="2" />
      <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14" />
    </svg>
  );
}

export function IconClock({ size, ...props }: IconProps) {
  return (
    <svg {...defaultProps} width={size ?? 16} height={size ?? 16} {...props}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

export function IconEdit({ size, ...props }: IconProps) {
  return (
    <svg {...defaultProps} width={size ?? 16} height={size ?? 16} {...props}>
      <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </svg>
  );
}

export function IconExternalLink({ size, ...props }: IconProps) {
  return (
    <svg {...defaultProps} width={size ?? 16} height={size ?? 16} {...props}>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

export function IconPlay({ size, ...props }: IconProps) {
  return (
    <svg {...defaultProps} width={size ?? 16} height={size ?? 16} {...props}>
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

export function IconCheckCircle({ size, ...props }: IconProps) {
  return (
    <svg {...defaultProps} width={size ?? 16} height={size ?? 16} {...props}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

export function IconStopCircle({ size, ...props }: IconProps) {
  return (
    <svg {...defaultProps} width={size ?? 16} height={size ?? 16} {...props}>
      <circle cx="12" cy="12" r="10" />
      <rect x="9" y="9" width="6" height="6" />
    </svg>
  );
}

export function IconShield({ size, ...props }: IconProps) {
  return (
    <svg {...defaultProps} width={size ?? 16} height={size ?? 16} {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

export function IconFilter({ size, ...props }: IconProps) {
  return (
    <svg {...defaultProps} width={size ?? 16} height={size ?? 16} {...props}>
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

export function IconSettings({ size, ...props }: IconProps) {
  return (
    <svg {...defaultProps} width={size ?? 16} height={size ?? 16} {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
