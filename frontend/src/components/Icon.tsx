import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Battery,
  BedDouble,
  Bell,
  ChevronUp,
  Bot,
  Building2,
  ChevronDown,
  Calendar,
  CheckCircle,
  CircleCheck,
  Clock,
  Copy,
  Edit2,
  ClipboardList,
  FileText,
  Globe,
  Grid,
  Heart,
  HeartPulse,
  Home,
  LogOut,
  Monitor,
  Phone,
  Pill,
  Plus,
  PlusCircle,
  Power,
  Search,
  Settings,
  Syringe,
  Shield,
  Thermometer,
  Trash2,
  User,
  Users,
  Wind,
  XCircle,
} from "lucide-react"
import type { SVGProps } from "react"

const ICONS: Record<string, React.ComponentType<SVGProps<SVGSVGElement>>> = {
  activity: Activity,
  "alert-circle": AlertCircle,
  "alert-triangle": AlertTriangle,
  "arrow-left": ArrowLeft,
  battery: Battery,
  bed: BedDouble,
  bell: Bell,
  building: Building2,
  "chevron-down": ChevronDown,
  "chevron-up": ChevronUp,
  calendar: Calendar,
  "check-circle": CheckCircle,
  "circle-check": CircleCheck,
  clock: Clock,
  clipboard: ClipboardList,
  copy: Copy,
  edit: Edit2,
  "file-text": FileText,
  globe: Globe,
  grid: Grid,
  heart: Heart,
  "heart-pulse": HeartPulse,
  home: Home,
  "log-out": LogOut,
  monitor: Monitor,
  phone: Phone,
  pill: Pill,
  plus: Plus,
  "plus-circle": PlusCircle,
  power: Power,
  robot: Bot,
  search: Search,
  settings: Settings,
  syringe: Syringe,
  shield: Shield,
  thermometer: Thermometer,
  trash: Trash2,
  user: User,
  users: Users,
  wind: Wind,
  "x-circle": XCircle,
}

// Only explicit sizes: 16, 20 or 24 px. No icon larger than 32 px.
// Sizes are applied as Tailwind classes so they override the global svg safety rule.
type IconSize = 16 | 20 | 24

const SIZE_CLASSES: Record<IconSize, string> = {
  16: "w-4 h-4",
  20: "w-5 h-5",
  24: "w-6 h-6",
}

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "size" | "color"> {
  name: keyof typeof ICONS
  size?: IconSize
  className?: string
}

export default function Icon({ name, size = 20, className = "", ...props }: IconProps) {
  const Comp = ICONS[name]
  if (!Comp) return null
  return (
    <Comp
      {...props}
      className={["icon", SIZE_CLASSES[size], className].filter(Boolean).join(" ")}
    />
  )
}
