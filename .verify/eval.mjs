const targets = await (await fetch("http://127.0.0.1:9222/json/list")).json()
const page = targets.find((t) => t.type === "page")
const ws = new WebSocket(page.webSocketDebuggerUrl)
let id = 0
const pending = new Map()
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
    msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result)
  }
})
await new Promise((r) => ws.addEventListener("open", r))
const expr = process.env.CB_EXPR
const result = await send("Runtime.evaluate", { expression: expr, returnByValue: true })
console.log(JSON.stringify(result.result.value, null, 2))
ws.close()
process.exit(0)
