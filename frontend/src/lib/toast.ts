type ToastVariant = "default" | "destructive"

let toastTimeout: ReturnType<typeof setTimeout> | null = null
let toastQueue: Array<{ title: string; description?: string; variant?: ToastVariant }> = []

// Palette only: success is a light-green (lime) surface with navy text, error is
// a navy surface with white text. Red is reserved for the critical banner and
// the E-STOP button, so error toasts are navy.
const VARIANT_CLASSES: Record<ToastVariant, string> = {
  default: "bg-lime text-navy border-navy/20",
  destructive: "bg-navy text-white border-navy",
}

function showNext() {
  if (toastQueue.length === 0) {
    toastTimeout = null
    return
  }
  const item = toastQueue.shift()!
  const variant: ToastVariant = item.variant ?? "default"

  const toast = document.createElement("div")
  toast.setAttribute("role", "alert")
  toast.setAttribute("aria-live", "polite")
  toast.className = [
    "fixed bottom-4 right-4 z-[60] max-w-sm rounded-xl border px-4 py-3 text-sm font-semibold shadow-card",
    "opacity-0 translate-y-2 transition-all duration-300 ease-out",
    VARIANT_CLASSES[variant],
  ].join(" ")

  const icon =
    variant === "destructive"
      ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>'
      : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14 2 4"/></svg>'

  // Text is inserted with textContent only — never innerHTML.
  const wrapper = document.createElement("div")
  wrapper.className = "flex items-start gap-3"

  const iconWrap = document.createElement("div")
  iconWrap.className = "flex-shrink-0"
  iconWrap.innerHTML = icon

  const body = document.createElement("div")
  body.className = "flex-1 min-w-0"
  const title = document.createElement("p")
  title.className = "font-bold"
  title.textContent = item.title
  body.appendChild(title)
  if (item.description) {
    const description = document.createElement("p")
    description.className = "mt-0.5 font-normal opacity-90"
    description.textContent = item.description
    body.appendChild(description)
  }

  wrapper.appendChild(iconWrap)
  wrapper.appendChild(body)
  toast.appendChild(wrapper)
  document.body.appendChild(toast)

  // Entrance
  setTimeout(() => {
    toast.classList.remove("opacity-0", "translate-y-2")
  }, 10)

  // Exit
  setTimeout(() => {
    toast.classList.add("opacity-0", "translate-y-2")
  }, 4000)

  setTimeout(() => {
    toast.remove()
    showNext()
  }, 4300)
}

function enqueue(title: string, description: string | undefined, variant: ToastVariant) {
  toastQueue.push({ title, description, variant })
  if (!toastTimeout) {
    toastTimeout = setTimeout(showNext, 100)
  }
}

// Public API
export function success(title: string, description?: string) {
  enqueue(title, description, "default")
}

export function error(title: string, description?: string) {
  enqueue(title, description, "destructive")
}

// Toast hook for useToast compatibility
export function useToast() {
  return { success, error }
}

// Auto-dismiss on page unload
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    toastQueue = []
    if (toastTimeout) clearTimeout(toastTimeout)
    toastTimeout = null
  })
}
