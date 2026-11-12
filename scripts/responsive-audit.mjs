import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'

const sizes = [[320,740],[375,812],[390,844],[430,932],[768,1024],[899,900],[900,900],[1024,768],[1280,800],[1440,900],[1920,1080],[390,600]]
const out = resolve('audit-output', 'p3.2')
const chrome = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const vitePort = 4179
const debugPort = 9228
const origin = `http://127.0.0.1:${vitePort}`
await mkdir(out, { recursive: true })

async function ready(url, attempts = 80) {
  for (let i = 0; i < attempts; i++) {
    try { const r = await fetch(url); if (r.ok) return await r.json().catch(() => ({})) } catch {}
    await delay(250)
  }
  throw new Error(`Timed out waiting for ${url}`)
}

class CDP {
  constructor(url) {
    this.ws = new WebSocket(url)
    this.next = 1
    this.pending = new Map()
    this.events = new Map()
    this.ws.addEventListener('message', ({ data }) => {
      const msg = JSON.parse(data)
      if (msg.id) {
        const p = this.pending.get(msg.id)
        this.pending.delete(msg.id)
        if (msg.error) p.reject(Error(msg.error.message))
        else p.resolve(msg.result)
      } else this.events.get(msg.method)?.forEach(fn => fn(msg.params))
    })
  }
  async open() { if (this.ws.readyState !== WebSocket.OPEN) await new Promise((ok, fail) => { this.ws.addEventListener('open', ok, { once: true }); this.ws.addEventListener('error', fail, { once: true }) }) }
  on(name, fn) { const list = this.events.get(name) || []; list.push(fn); this.events.set(name, list) }
  send(method, params = {}) { const id = this.next++; return new Promise((resolve, reject) => { this.pending.set(id, { resolve, reject }); this.ws.send(JSON.stringify({ id, method, params })) }) }
  async eval(expression) { const r = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw Error(r.exceptionDetails.text); return r.result.value }
  close() { this.ws.close() }
}

const vite = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', String(vitePort), '--strictPort'], { stdio: 'ignore' })
let browser
let cdp
const report = { generatedAt: new Date().toISOString(), browser: chrome, viewports: [], interactions: {}, findings: [], visualRegression: { status: 'unverified', reason: 'No independently approved P3.1 screenshot baseline exists in the repository.' } }
try {
  await ready(origin)
  report.favicons = {}
  for (const file of ['favicon.svg', 'favicon.ico']) {
    const response = await fetch(`${origin}/${file}`)
    report.favicons[file] = { status: response.status, contentType: response.headers.get('content-type') }
  }
  browser = spawn(chrome, ['--headless=new', '--disable-gpu-sandbox', '--no-first-run', '--no-default-browser-check', `--remote-debugging-port=${debugPort}`, `--user-data-dir=${resolve(out, 'chrome-profile')}`, 'about:blank'], { stdio: 'ignore' })
  report.browserVersion = (await ready(`http://127.0.0.1:${debugPort}/json/version`)).Browser
  const targets = await (await fetch(`http://127.0.0.1:${debugPort}/json`)).json()
  cdp = new CDP(targets.find(t => t.type === 'page').webSocketDebuggerUrl)
  await cdp.open()
  await Promise.all(['Page.enable','Runtime.enable','Network.enable','Log.enable'].map(x => cdp.send(x)))
  let errors = [], failed = []
  cdp.on('Runtime.exceptionThrown', p => errors.push(p.exceptionDetails?.text || 'JavaScript exception'))
  cdp.on('Log.entryAdded', p => { if (p.entry.level === 'error') errors.push(p.entry.text) })
  cdp.on('Network.loadingFailed', p => failed.push({ requestId: p.requestId, error: p.errorText }))
  cdp.on('Network.responseReceived', p => { if (p.response.status >= 400) failed.push({ url:p.response.url, status:p.response.status }) })
  async function navigate() { await cdp.send('Page.navigate', { url: origin }); await delay(2300); await cdp.eval('document.fonts.ready') }
  async function shot(name, clip) { const r = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, ...(clip ? { clip } : {}) }); await writeFile(resolve(out, name), Buffer.from(r.data, 'base64')) }
  async function metrics() { return cdp.eval(`(() => {
    const box = s => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { x:+r.x.toFixed(1), y:+r.y.toFixed(1), width:+r.width.toFixed(1), height:+r.height.toFixed(1), right:+r.right.toFixed(1), bottom:+r.bottom.toFixed(1) } };
    return { documentWidth:document.documentElement.scrollWidth, viewportWidth:innerWidth, horizontalOverflow:document.documentElement.scrollWidth > innerWidth, pageHeight:document.documentElement.scrollHeight, header:box('.site-header'), heading:box('#hero-title'), registerCTA:box('.hero-actions .button-primary'), exploreCTA:box('.hero-actions .button-text'), globe:box('.hero-globe'), globeCanvas:box('.hero-globe canvas'), scrollCue:box('.scroll-cue'), hero:box('.hero'), fallback:box('.globe-fallback'), touchAction:getComputedStyle(document.querySelector('.hero-globe canvas') || document.querySelector('.hero-globe')).touchAction };
  })()`) }
  for (const [width,height] of sizes) {
    errors = []; failed = []
    const mobile = width <= 899
    await cdp.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile })
    await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: mobile, maxTouchPoints: 1 })
    await navigate()
    const m = await metrics()
    const key = `${width}x${height}`
    await shot(`${key}-full.png`)
    await shot(`${key}-hero.png`, { x: 0, y: 0, width, height: Math.ceil(m.hero.height), scale: 1 })
    report.viewports.push({ size: key, ...m, consoleErrors: [...errors], failedNetworkRequests: [...failed], screenshots: [`${key}-full.png`, `${key}-hero.png`] })
    if (m.horizontalOverflow) report.findings.push({ size:key, severity:'fail', detail:'Document has horizontal overflow.' })
    if (m.scrollCue && m.globe && m.scrollCue.x < m.globe.right && m.scrollCue.right > m.globe.x && m.scrollCue.y < m.globe.bottom && m.scrollCue.bottom > m.globe.y) report.findings.push({ size:key, severity:'visual-review', detail:'Scroll cue bounding box intersects the globe bounding box; inspect hero screenshot.' })
    if (errors.length || failed.length) report.findings.push({ size:key, severity:'review', detail:`${errors.length} console errors, ${failed.length} failed network requests.` })
  }
  const check = async (name, fn) => { try { report.interactions[name] = await fn() } catch (e) { report.interactions[name] = { status: 'failed', error: String(e) } } }
  await cdp.send('Emulation.setDeviceMetricsOverride', { width:390, height:844, deviceScaleFactor:1, mobile:true })
  await cdp.send('Emulation.setTouchEmulationEnabled', { enabled:true, maxTouchPoints:1 })
  await navigate()
  await check('exploreTouchTarget', async () => { const m = await metrics(); return { status:m.exploreCTA.height >= 44 ? 'passed':'failed', height:m.exploreCTA.height, width:m.exploreCTA.width } })
  await check('navigation', async () => {
    const before = await cdp.eval("document.querySelector('.menu-toggle').getAttribute('aria-expanded')")
    await cdp.eval("document.querySelector('.menu-toggle').click()")
    const opened = await cdp.eval("document.querySelector('.menu-toggle').getAttribute('aria-expanded')")
    await cdp.eval("document.querySelector('.menu-toggle').click()")
    const closed = await cdp.eval("document.querySelector('.menu-toggle').getAttribute('aria-expanded')")
    return { status:before === 'false' && opened === 'true' && closed === 'false' ? 'passed':'failed', before, opened, closed }
  })
  await check('globeVerticalScroll', async () => {
    const b = await metrics(); const x = Math.min(350, Math.max(30, b.globe.x + b.globe.width/2)); const y = Math.min(770, Math.max(120, b.globe.y + b.globe.height/2))
    await cdp.send('Input.dispatchTouchEvent', { type:'touchStart', touchPoints:[{ x,y,id:1 }] })
    for (let i=1;i<=7;i++) await cdp.send('Input.dispatchTouchEvent', { type:'touchMove', touchPoints:[{ x,y:y-i*35,id:1 }] })
    await cdp.send('Input.dispatchTouchEvent', { type:'touchEnd', touchPoints:[] })
    await delay(800)
    const scrollY = await cdp.eval('window.scrollY')
    return { status:scrollY > 20 ? 'passed':'failed', scrollY, note:'Chromium touch emulation; physical device unverified.' }
  })
  await check('horizontalGlobeDrag', async () => {
    await cdp.eval('window.scrollTo(0,0)'); await delay(400)
    const m = await metrics(); const x = Math.min(300, Math.max(30, m.globe.x + m.globe.width/2)); const y = Math.min(750, Math.max(130, m.globe.y + m.globe.height/2))
    const target = await cdp.eval(`document.elementFromPoint(${x},${y})?.tagName`)
    await cdp.send('Input.dispatchTouchEvent', { type:'touchStart', touchPoints:[{x,y,id:2}] })
    for (let i=1;i<=6;i++) await cdp.send('Input.dispatchTouchEvent', { type:'touchMove', touchPoints:[{x:x-i*25,y,id:2}] })
    await cdp.send('Input.dispatchTouchEvent', { type:'touchEnd', touchPoints:[] })
    return { status:target === 'CANVAS' ? 'unverified':'unverified', hitTarget:target, note:'Synthetic drag dispatched; canvas rotation cannot be measured reliably without instrumenting globe internals. Inspect screenshots or test on a device.' }
  })
  await check('reducedMotion', async () => {
    await cdp.send('Emulation.setEmulatedMedia', { features:[{name:'prefers-reduced-motion',value:'reduce'}] })
    await navigate(); const matched = await cdp.eval("matchMedia('(prefers-reduced-motion: reduce)').matches")
    const transition = await cdp.eval("getComputedStyle(document.querySelector('.menu-toggle')).transitionDuration")
    return { status:matched && transition.includes('1e-05') || matched && transition.includes('0.00001') ? 'passed':'unverified', matched, transition }
  })
  await cdp.send('Emulation.setEmulatedMedia', { features:[] })
  await check('webglFallback', async () => {
    await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source:"const originalGetContext = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function(type, ...args) { if (type === 'webgl2') return null; return originalGetContext.call(this, type, ...args) }" })
    await navigate(); const m = await metrics()
    await shot('390x844-webgl-fallback.png', {x:0,y:0,width:390,height:Math.ceil(m.hero.height),scale:1})
    const visible = await cdp.eval("(() => { const e=document.querySelector('.globe-fallback'); return !!e && getComputedStyle(e).visibility !== 'hidden' && e.getBoundingClientRect().width > 0 })()")
    return { status:visible && m.fallback?.right > 0 && m.fallback?.x < 390 ? 'passed':'failed', visible, box:m.fallback, screenshot:'390x844-webgl-fallback.png' }
  })
} catch (e) { report.fatalError = String(e); process.exitCode = 1 }
finally {
  await writeFile(resolve(out, 'report.json'), JSON.stringify(report, null, 2))
  const rows = report.viewports.map(v => `| ${v.size} | ${v.horizontalOverflow ? 'FAIL':'pass'} | ${v.header?.width}×${v.header?.height} | ${v.heading?.x},${v.heading?.y} ${v.heading?.width}×${v.heading?.height} | ${v.exploreCTA?.width}×${v.exploreCTA?.height} | ${v.globe?.x},${v.globe?.y} ${v.globe?.width}×${v.globe?.height} | ${v.scrollCue?.x},${v.scrollCue?.y} | ${v.consoleErrors.length} | ${v.failedNetworkRequests.length} | [full](${v.screenshots[0]}) · [hero](${v.screenshots[1]}) |`).join('\n')
  const interactions = Object.entries(report.interactions).map(([k,v]) => `- **${k}: ${v.status}** — ${JSON.stringify(v)}`).join('\n')
  const findings = report.findings.map(f => `- **${f.size} ${f.severity}:** ${f.detail}`).join('\n') || 'None detected by automated geometry and browser checks.'
  await writeFile(resolve(out, 'report.md'), `# P3.2 responsive audit\n\nGenerated ${report.generatedAt}. Browser: ${report.browserVersion || chrome}. Chromium emulation is not physical-device testing.\n\n${report.fatalError ? `Fatal error: ${report.fatalError}\n\n` : ''}## Favicons\n\n${Object.entries(report.favicons || {}).map(([file,r]) => `- ${file}: HTTP ${r.status}, ${r.contentType}`).join('\n')}\n\n## Viewports\n\n| Size | Overflow | Header | Heading | Explore CTA | Globe | Scroll cue | Console errors | Network failures | Screenshots |\n|---|---|---|---|---|---|---|---:|---:|---|\n${rows}\n\n## Findings\n\n${findings}\n\n## Interactions\n\n${interactions}\n\n## Visual regression\n\nUnverified: ${report.visualRegression.reason}\n\nSee report.json for every bounding box, error, request failure, and screenshot path.\n`)
  cdp?.close(); browser?.kill(); vite.kill()
}
