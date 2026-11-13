let toastTimeout: ReturnType<typeof setTimeout> | null = null
let toastQueue: Array<{ title: string; description?: string; variant?: "default" | "destructive" }> = []

function showNext() {
  if (toastQueue.length === 0) return
  const item = toastQueue.shift()!
  // Title and description are rendered below
  const toast = document.createElement("div")
  toast.setAttribute("role", "alert")
  toast.setAttribute("aria-live", "polite")
  const variantClass = item.variant === "destructive"
    ? "bg-red-100 text-red-800 border-red-200"
    : "bg-green-100 text-green-800 border-green-200"
  toast.className = `fixed bottom-4 right-4 rounded-md border px-4 py-3 text-sm font-medium transition-all duration-500 ease-out ${variantClass}`
  toast.innerHTML = `
    <div class="flex items-start gap-3">
      <div class="flex-shrink-0">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          {item.variant === "destructive"
            ? '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/></svg>'
            : '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14 2 4"/></svg>'}
      </div>
      <div class="flex-1 min-w-0">
        <p class="font-medium">{item.title}</p>
        {item.description && <p className="text-opacity-90">{item.description}</p>}
      </div>
    </div>
  `
  document.body.appendChild(toast)

  // Trigger entrance
  setTimeout(() => (toast as HTMLElement).classList.add("opacity-100", "translate-y-0"), 10)
  setTimeout(() => {
    ;(toast as HTMLElement).classList.add("opacity-0", "translate-y-2")
    ;(toast as HTMLElement).className = (toast as HTMLElement).className
      .replace(" opacity-100 translate-y-0", "")
  }, 4000)

  setTimeout(() => {
    if (toast.parentNode) document.body.removeChild(toast)
    showNext()
  }, 4500)
}

// Public API
export function success(title: string, description?: string) {
  toastQueue.push({ title, description, variant: "default" })
  if (!toastTimeout) {
    toastTimeout = setTimeout(showNext, 100)
  }
}

export function error(title: string, description?: string) {
  toastQueue.push({ title, description, variant: "destructive" })
  if (!toastTimeout) {
    toastTimeout = setTimeout(showNext, 100)
  }
}

// Toast hook for useToast compatibility
export function useToast() {
  return { success, error }
}

// Auto-dismiss on page unload
window.addEventListener("beforeunload", () => {
  toastQueue = []
  if (toastTimeout) clearTimeout(toastTimeout)
  toastTimeout = null
})