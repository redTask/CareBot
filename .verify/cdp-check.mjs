import fs from "node:fs"

const token = process.env.CB_TOKEN
const user = {
  id: 1,
  name: "Nurse User",
  email: "nurse@carebot.in",
  role: "nurse",
}

const targets = await (await fetch("http://127.0.0.1:9222/json/list")).json()
const page = targets.find((t) => t.type === "page")
const ws = new WebSocket(page.webSocketDebuggerUrl)

let id = 0
const pending = new Map()
const errors = []
const consoleLogs = []

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const messageId = ++id
    pending.set(messageId, { resolve, reject })
    ws.send(JSON.stringify({ id: messageId, method, params }))
  })
}

ws.addEventListener("message", (event) => {
  const msg = JSON.parse(event.data)
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id)
    pending.delete(msg.id)
    if (msg.error) reject(new Error(JSON.stringify(msg.error)))
    else resolve(msg.result)
    return
  }
  if (msg.method === "Runtime.consoleAPICalled") {
    const text = msg.params.args
      .map((a) => a.value ?? a.description ?? "")
      .join(" ")
    consoleLogs.push(`${msg.params.type}: ${text}`)
    if (msg.params.type === "error") errors.push(`console.error: ${text}`)
  }
  if (msg.method === "Runtime.exceptionThrown") {
    const d = msg.params.exceptionDetails
    errors.push(
      `exception: ${d.exception?.description ?? d.text}${d.url ? ` (${d.url}:${d.lineNumber})` : ""}`
    )
  }
  if (msg.method === "Log.entryAdded") {
    const e = msg.params.entry
    if (e.level === "error") errors.push(`log(${e.source}): ${e.text} ${e.url ?? ""}`)
  }
})

await new Promise((resolve, reject) => {
  ws.addEventListener("open", resolve)
  ws.addEventListener("error", reject)
})

const viewportWidth = Number(process.env.CB_WIDTH || 1440)
const viewportHeight = Number(process.env.CB_HEIGHT || 900)
await send("Emulation.setDeviceMetricsOverride", {
  width: viewportWidth,
  height: viewportHeight,
  deviceScaleFactor: 1,
  mobile: false,
})
await send("Page.enable")
await send("Page.navigate", { url: "about:blank" })
await new Promise((r) => setTimeout(r, 500))
await send("Runtime.enable")
await send("Log.enable")
await send("Page.addScriptToEvaluateOnNewDocument", {
  source: `localStorage.setItem("carebot-auth", ${JSON.stringify(
    JSON.stringify({ state: { token, user }, version: 0 })
  )})`,
})

const loaded = new Promise((resolve) => {
  const timer = setTimeout(resolve, 8000)
  const handler = (event) => {
    const msg = JSON.parse(event.data)
    if (msg.method === "Page.loadEventFired") {
      clearTimeout(timer)
      resolve()
    }
  }
  ws.addEventListener("message", handler)
})

const targetUrl = process.env.CB_URL || "http://localhost:5173/dashboard"
const shotName = process.env.CB_SHOT || "dashboard"
await send("Page.navigate", { url: targetUrl })
await loaded
await new Promise((r) => setTimeout(r, 5000))

const result = await send("Runtime.evaluate", {
  expression: `JSON.stringify({
    path: location.pathname,
    title: document.title,
    heading: document.querySelector("h1")?.textContent?.trim() ?? null,
    bodyText: document.body.innerText.slice(0, 400),
    viewport: [window.innerWidth, window.innerHeight],
    scrollWidth: document.documentElement.scrollWidth,
    overflowX: document.documentElement.scrollWidth > window.innerWidth + 1
  })`,
  returnByValue: true,
})
const shot = await send("Page.captureScreenshot", { format: "png" })
fs.mkdirSync(".verify", { recursive: true })
fs.writeFileSync(`.verify/${shotName}.png`, Buffer.from(shot.data, "base64"))

console.log("PAGE:", result.result.value)
console.log("CONSOLE_LOGS:", JSON.stringify(consoleLogs.slice(0, 40), null, 2))
console.log("ERRORS:", JSON.stringify(errors, null, 2))
ws.close()
process.exit(errors.length ? 1 : 0)
