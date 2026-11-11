import { SVGProps } from "react"

type IconSize = "xs" | "sm" | "md" | "lg" | "xl"

const SIZE_MAP: Record<IconSize, string> = {
  xs: "w-4 h-4",    // 16px inline with text
  sm: "w-5 h-5",    // 20px default
  md: "w-6 h-6",    // 24px buttons and headers
  lg: "w-8 h-8",    // 32px large status badges
  xl: "w-12 h-12",  // 48px empty-state illustration only
}

interface IconProps extends SVGProps<SVGSVGElement> {
  size?: IconSize
  children: React.ReactNode
}

export default function Icon({ size = "sm", className = "", ...props }: IconProps) {
  return (
    <svg
      {...props}
      className={SIZE_MAP[size] + " " + className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
    />
  )
}
