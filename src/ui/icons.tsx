/**
 * Inline icon set. Every icon inherits `currentColor` and sizes from the
 * `size` prop so it can be dropped anywhere without extra styling.
 */
interface IconProps {
  size?: number
  className?: string
}

function svgProps({ size = 18, className }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    focusable: false,
    className,
  }
}

export function DashboardIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="M3 17.5 9 11l4 4 8-8" />
      <path d="M16 7h5v5" />
    </svg>
  )
}

export function TestCreationIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  )
}

export function BellIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  )
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

export function ChevronsLeftIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="m11 17-5-5 5-5" />
      <path d="m18 17-5-5 5-5" />
    </svg>
  )
}

export function PencilIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  )
}

export function TrashIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="M3 6h18" />
      <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  )
}

export function ClockIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}

export function FileIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
      <path d="M14 3v5h5" />
    </svg>
  )
}

export function AwardIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <circle cx="12" cy="9" r="6" />
      <path d="m8.5 14-1.5 7 5-3 5 3-1.5-7" />
    </svg>
  )
}

export function LeafIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="M11 20A7 7 0 0 1 4 13c0-6 6-9 16-10 0 10-3 16-9 17Z" />
      <path d="M8 17c2-4 5-6 8-7" />
    </svg>
  )
}

export function CheckCircleIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.5 2.5 2.5 4.5-5" />
    </svg>
  )
}

export function CircleIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <circle cx="12" cy="12" r="9" />
    </svg>
  )
}

export function PlusIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export function UploadIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M12 4v12" />
    </svg>
  )
}

export function CalendarIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  )
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="M6 6 18 18M18 6 6 18" />
    </svg>
  )
}

export function SearchIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  )
}

export function LogoutIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  )
}

/* -------------------------------------------------------------------------
   Rich text editor toolbar
   ------------------------------------------------------------------------- */

export function ItalicIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="M19 4h-9M14 20H5M15 4 9 20" />
    </svg>
  )
}

export function BoldIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="M6 4h7a4 4 0 0 1 0 8H6zM6 12h8a4 4 0 0 1 0 8H6z" />
    </svg>
  )
}

export function UnderlineIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="M6 4v6a6 6 0 0 0 12 0V4" />
      <path d="M4 21h16" />
    </svg>
  )
}

export function StrikethroughIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="M4 12h16" />
      <path d="M17 7a4 4 0 0 0-4-3h-2a3.5 3.5 0 0 0-1.5 6.5" />
      <path d="M7 17a4 4 0 0 0 4 3h2a3.5 3.5 0 0 0 2-6.5" />
    </svg>
  )
}

export function LinkIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
      <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
    </svg>
  )
}

export function ColorIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <rect x="4" y="4" width="16" height="16" rx="2" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function AlignLeftIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="M4 6h16M4 12h10M4 18h13" />
    </svg>
  )
}

export function AlignCenterIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="M4 6h16M7 12h10M6 18h12" />
    </svg>
  )
}

export function AlignRightIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="M4 6h16M10 12h10M7 18h13" />
    </svg>
  )
}

export function ListUnorderedIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="M9 6h11M9 12h11M9 18h11" />
      <circle cx="4.5" cy="6" r="1.2" fill="currentColor" />
      <circle cx="4.5" cy="12" r="1.2" fill="currentColor" />
      <circle cx="4.5" cy="18" r="1.2" fill="currentColor" />
    </svg>
  )
}

export function ListOrderedIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="M10 6h10M10 12h10M10 18h10" />
      <path d="M4 5h1v4M4 15h2v1H4v2h2" />
    </svg>
  )
}

export function TableIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 10h18M11 10v9" />
    </svg>
  )
}

export function RuleIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="M4 9h16M4 15h16" />
    </svg>
  )
}

export function ImageIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="m4 18 5-5 4 4 3-2 4 3" />
    </svg>
  )
}

export function FormulaIcon(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="M5 20c2 0 2.5-1.5 3-4l2-9c.5-2.5 1-4 3-4" />
      <path d="M5 10h7" />
      <path d="m14 12 6 7M20 12l-6 7" />
    </svg>
  )
}
