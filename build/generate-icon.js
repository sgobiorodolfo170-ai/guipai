/**
 * 图标生成器 —— 龟派（guipai）应用图标
 *
 * 零外部依赖：手写 PNG 编码（zlib 为 Node 内置）+ 手写 ICO 封装（内嵌 PNG 帧）。
 * 设计：深色底 #0d1117（与应用 backgroundColor 一致）+ A股红涨上升折线 #ef232a。
 *
 * 用法：node build/generate-icon.js
 * 产出：build/icon.ico（16/24/32/48/64/128/256 多尺寸）、build/icon.png（1024 源图）
 */

const zlib = require('zlib')
const fs = require('fs')
const path = require('path')

// ---- 主题色（与项目配色统一） ----
const BG = [0x0d, 0x11, 0x17]      // 深色底
const UP = [0xef, 0x23, 0x2a]      // 涨（红）
const UP_SOFT = [0xff, 0x6b, 0x6b] // 折线高光

// ============ 基础绘图工具（RGBA 画布） ============

function createCanvas(size) {
  return { size, data: new Uint8Array(size * size * 4) }
}

/** alpha 混合写点 */
function blend(c, x, y, rgb, a) {
  if (x < 0 || y < 0 || x >= c.size || y >= c.size || a <= 0) return
  const i = (y * c.size + x) * 4
  const da = c.data[i + 3] / 255
  const outA = a + da * (1 - a)
  if (outA <= 0) return
  c.data[i] = (rgb[0] * a + c.data[i] * da * (1 - a)) / outA
  c.data[i + 1] = (rgb[1] * a + c.data[i + 1] * da * (1 - a)) / outA
  c.data[i + 2] = (rgb[2] * a + c.data[i + 2] * da * (1 - a)) / outA
  c.data[i + 3] = outA * 255
}

/** 圆角矩形内部覆盖率（0=外部, 1=内部），用于遮罩裁剪 */
function roundRectCoverage(c, x0, y0, w, h, r, px, py) {
  const x1 = x0 + w, y1 = y0 + h
  const cx = Math.min(Math.max(px, x0 + r), x1 - r)
  const cy = Math.min(Math.max(py, y0 + r), y1 - r)
  const dx = px - cx, dy = py - cy
  const dist = Math.sqrt(dx * dx + dy * dy) - r
  return Math.min(Math.max(0.5 - dist, 0), 1)
}

/** 抗锯齿填充圆角矩形：signed distance 决定覆盖率 */
function fillRoundRect(c, x0, y0, w, h, r, rgb, alpha = 1) {
  const S = c.size
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const cov = roundRectCoverage(c, x0, y0, w, h, r, x + 0.5, y + 0.5)
      if (cov > 0) blend(c, x, y, rgb, cov * alpha)
    }
  }
}

/** 抗锯齿画粗线段（圆头圆角） */
function strokeLine(c, x1, y1, x2, y2, width, rgb, alpha = 1) {
  const S = c.size
  const hw = width / 2
  const minX = Math.floor(Math.min(x1, x2) - hw - 2)
  const maxX = Math.ceil(Math.max(x1, x2) + hw + 2)
  const minY = Math.floor(Math.min(y1, y2) - hw - 2)
  const maxY = Math.ceil(Math.max(y1, y2) + hw + 2)
  const vx = x2 - x1, vy = y2 - y1
  const len2 = vx * vx + vy * vy || 1
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const px = x + 0.5 - x1, py = y + 0.5 - y1
      // 投影参数 t
      let t = (px * vx + py * vy) / len2
      t = Math.min(Math.max(t, 0), 1)
      const dx = px - t * vx, dy = py - t * vy
      const dist = Math.sqrt(dx * dx + dy * dy) - hw
      const cov = Math.min(Math.max(0.5 - dist, 0), 1)
      if (cov > 0) blend(c, x, y, rgb, cov * alpha)
    }
  }
}

// ============ 图标绘制 ============

/**
 * 绘制图标到画布。
 * 设计：深色圆角底 + A股红涨上升折线（锐利箭头收尾）+ 节点高亮点。
 * 保持底色纯净，不加大面积填充，确保小尺寸（16px）下轮廓依然清晰可辨。
 */
function drawIcon(size) {
  const c = createCanvas(size)
  const S = size
  const u = S / 256 // 基准单位（设计稿 256）

  // 圆角底
  const pad = 8 * u
  const bw = S - pad * 2
  const radius = 56 * u
  fillRoundRect(c, pad, pad, bw, bw, radius, BG, 1)

  // 上升折线数据点（设计稿 256 空间）
  // 末点下移留出箭头空间，保证箭头尖端完整落在圆角底内
  const pts = [
    [56, 196],
    [104, 154],
    [140, 176],
    [168, 126]
  ]

  // 主折线（红）
  const lineW = 22 * u
  for (let k = 0; k < pts.length - 1; k++) {
    strokeLine(c, pts[k][0] * u, pts[k][1] * u, pts[k + 1][0] * u, pts[k + 1][1] * u, lineW, UP, 1)
  }

  // 末端箭头：从末点沿趋势方向延伸，总长受控不越界
  const last = pts[pts.length - 1]
  const prev = pts[pts.length - 2]
  const dx = last[0] - prev[0], dy = last[1] - prev[1]
  const len = Math.hypot(dx, dy)
  const ux = dx / len, uy = dy / len
  const px = -uy, py = ux // 法线方向

  // 箭头三角形：尖端沿趋势方向延伸，底边与折线末端重叠以避免断口
  const tipLen = 52 * u
  const halfW = 21 * u
  const tipX = (last[0] + ux * tipLen) * u
  const tipY = (last[1] + uy * tipLen) * u
  // 底边后移到折线末点内侧（-6u），与圆头线段充分重叠
  const baseCX = (last[0] - ux * 6) * u
  const baseCY = (last[1] - uy * 6) * u
  fillTriangle(c,
    tipX, tipY,
    baseCX + px * halfW, baseCY + py * halfW,
    baseCX - px * halfW, baseCY - py * halfW,
    UP, 1)

  // 折线节点高亮点（浅红小圆）——跳过末点，避免干扰箭头
  for (let k = 0; k < pts.length - 1; k++) {
    const p = pts[k]
    fillCircle(c, p[0] * u, p[1] * u, 8 * u, UP_SOFT, 1)
  }

  return c
}

/** 抗锯齿填充三角形：按到三边的最短内向距离做覆盖率羽化 */
function fillTriangle(c, ax, ay, bx, by, cx2, cy2, rgb, alpha = 1) {
  const S = c.size
  const verts = [[ax, ay], [bx, by], [cx2, cy2]]
  // 有向面积：判断顶点绕向
  const area2 = (bx - ax) * (cy2 - ay) - (by - ay) * (cx2 - ax)
  if (Math.abs(area2) < 1e-9) return
  const sgn = area2 >= 0 ? 1 : -1

  // 重心：用于判定每条边的"内侧"朝向
  const gx = (ax + bx + cx2) / 3
  const gy = (ay + by + cy2) / 3

  // 构造三条边，保证 (px*nx+py*ny+d) 在三角形内部为正
  const edges = []
  for (let i = 0; i < 3; i++) {
    const [x1, y1] = verts[i]
    const [x2, y2] = verts[(i + 1) % 3]
    const ex = x2 - x1, ey = y2 - y1
    const len = Math.hypot(ex, ey)
    if (len < 1e-9) continue
    // 两种候选法线，取使重心落在正侧的那个
    let nx = ey / len, ny = -ex / len
    let d = -(x1 * nx + y1 * ny)
    if (gx * nx + gy * ny + d < 0) { nx = -nx; ny = -ny; d = -d }
    edges.push({ nx, ny, d })
  }

  const minX = Math.max(0, Math.floor(Math.min(ax, bx, cx2) - 2))
  const maxX = Math.min(S - 1, Math.ceil(Math.max(ax, bx, cx2) + 2))
  const minY = Math.max(0, Math.floor(Math.min(ay, by, cy2) - 2))
  const maxY = Math.min(S - 1, Math.ceil(Math.max(ay, by, cy2) + 2))

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const px = x + 0.5, py = y + 0.5
      let dmin = Infinity
      for (const e of edges) {
        const dist = px * e.nx + py * e.ny + e.d
        if (dist < dmin) dmin = dist
      }
      const cov = Math.min(Math.max(dmin + 0.5, 0), 1)
      if (cov > 0) blend(c, x, y, rgb, cov * alpha)
    }
  }
}

/** 抗锯齿实心圆 */
function fillCircle(c, cx, cy, r, rgb, alpha = 1) {
  const S = c.size
  for (let y = Math.floor(cy - r - 2); y <= Math.ceil(cy + r + 2); y++) {
    for (let x = Math.floor(cx - r - 2); x <= Math.ceil(cx + r + 2); x++) {
      const dx = x + 0.5 - cx, dy = y + 0.5 - cy
      const dist = Math.sqrt(dx * dx + dy * dy) - r
      const cov = Math.min(Math.max(0.5 - dist, 0), 1)
      if (cov > 0) blend(c, x, y, rgb, cov * alpha)
    }
  }
}

function clamp01(v) { return Math.min(Math.max(v, 0), 1) }

// ============ PNG 编码 ============

function crc32(buf) {
  let table = crc32.table
  if (!table) {
    table = crc32.table = new Int32Array(256)
    for (let n = 0; n < 256; n++) {
      let c = n
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      table[n] = c
    }
  }
  let crc = -1
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff]
  return (crc ^ -1) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([len, typeBuf, data, crcBuf])
}

/** 画布 -> PNG buffer（RGBA, 8bit, 非隔行） */
function encodePNG(c) {
  const { size, data } = c
  const stride = size * 4
  const raw = Buffer.alloc(size * (stride + 1))
  for (let y = 0; y < size; y++) {
    const rowStart = y * (stride + 1)
    raw[rowStart] = 0 // filter type 0 (None)
    for (let x = 0; x < stride; x++) {
      raw[rowStart + 1 + x] = data[y * stride + x]
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8   // bit depth
  ihdr[9] = 6   // color type RGBA
  ihdr[10] = 0  // compression
  ihdr[11] = 0  // filter
  ihdr[12] = 0  // interlace
  const idat = zlib.deflateSync(raw, { level: 9 })
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0))
  ])
}

// ============ ICO 编码（PNG 帧） ============

/**
 * 将多个 PNG buffer 打包为 ICO。
 * @param {Array<{size:number, png:Buffer}>} frames
 */
function encodeICO(frames) {
  const count = frames.length
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)      // reserved
  header.writeUInt16LE(1, 2)      // type = 1 (icon)
  header.writeUInt16LE(count, 4)  // image count

  const entries = []
  let offset = 6 + count * 16
  for (const f of frames) {
    const e = Buffer.alloc(16)
    e[0] = f.size >= 256 ? 0 : f.size // width (0 = 256)
    e[1] = f.size >= 256 ? 0 : f.size // height
    e[2] = 0  // color palette
    e[3] = 0  // reserved
    e.writeUInt16LE(1, 4)  // color planes
    e.writeUInt16LE(32, 6) // bits per pixel
    e.writeUInt32LE(f.png.length, 8)
    e.writeUInt32LE(offset, 12)
    entries.push(e)
    offset += f.png.length
  }
  return Buffer.concat([header, ...entries, ...frames.map(f => f.png)])
}

// ============ 主流程 ============

function main() {
  const buildDir = __dirname
  const sizes = [16, 24, 32, 48, 64, 128, 256]

  // 缓存各尺寸画布（避免重复绘制同一尺寸）
  const cache = new Map()
  const getCanvas = (s) => {
    if (!cache.has(s)) cache.set(s, drawIcon(s))
    return cache.get(s)
  }

  const frames = sizes.map(s => ({ size: s, png: encodePNG(getCanvas(s)) }))
  const ico = encodeICO(frames)
  fs.writeFileSync(path.join(buildDir, 'icon.ico'), ico)

  // 1024 源图（供后续设计迭代）
  const src = encodePNG(getCanvas(1024))
  fs.writeFileSync(path.join(buildDir, 'icon.png'), src)

  console.log('[icon] build/icon.ico 已生成:', ico.length, 'bytes, sizes =', sizes.join(','))
  console.log('[icon] build/icon.png 已生成:', src.length, 'bytes, 1024x1024')
}

main()