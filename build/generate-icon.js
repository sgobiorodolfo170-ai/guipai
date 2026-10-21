/**
 * 图标生成器 —— 从源图片生成龟派（guipai）全套应用图标
 *
 * 零外部依赖：手写 PNG 解码/编码（zlib 为 Node 内置）+ 手写 ICO 封装（内嵌 PNG 帧）
 * + 手写 ICNS 封装（macOS 支持内嵌 PNG）。
 *
 * 用法：node build/generate-icon.js [源图片路径]
 *   - 缺省源路径为 build/source-icon.png（可复现的仓库内源图）；
 *     也可传入外部图片路径覆盖，如
 *     node build/generate-icon.js "C:\Users\Administrator\Pictures\软件图标\福运上涨：吉祥龟攀升股市.png"
 *
 * 产出：
 *   - build/icon.ico      Windows 图标（16/24/32/48/64/128/256 七帧内嵌 PNG）
 *   - build/icon.png      1024×1024 参考大图（由源图重采样，供设计迭代/展示用）
 *   - build/icon.icns     macOS 图标（16/32/64/128/256/512/1024 内嵌 PNG）
 *   - frontend/public/favicon.ico、frontend/public/icon.png 同步副本
 *
 * 重采样策略：缩小用面积平均（area-average），放大用双线性（bilinear），
 * 通道在预乘 alpha 空间内插值以避免半透明边缘黑边。
 */

const zlib = require('zlib')
const fs = require('fs')
const path = require('path')

// ---- 源图片（缺省走仓库内 source-icon.png，保证可复现） ----
const DEFAULT_SRC = path.join(__dirname, 'source-icon.png')
const SRC = process.argv[2] || DEFAULT_SRC

const ICO_SIZES = [16, 24, 32, 48, 64, 128, 256]
const ICNS_SIZES = [16, 32, 64, 128, 256, 512, 1024]
const PNG_SIZE = 1024

// ============ PNG 解码 ============

function readChunks(buf) {
  const chunks = []
  let off = 8
  while (off + 8 <= buf.length) {
    const len = buf.readUInt32BE(off)
    const type = buf.toString('ascii', off + 4, off + 8)
    chunks.push({ type, data: buf.subarray(off + 8, off + 8 + len) })
    off += 12 + len
  }
  return chunks
}

/** 逆滤波：原始扫描线字节 → 去滤波后的逐行字节 */
function defilter(raw, w, h, bpp) {
  const stride = w * bpp
  const out = Buffer.alloc(h * stride)
  let prev = Buffer.alloc(stride)
  for (let y = 0; y < h; y++) {
    const filter = raw[y * (stride + 1)]
    const row = out.subarray(y * stride, (y + 1) * stride)
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1))
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? row[x - bpp] : 0
      const b = prev[x]
      const c = x >= bpp ? prev[x - bpp] : 0
      let v = line[x]
      switch (filter) {
        case 0: break
        case 1: v = (v + a) & 0xff; break
        case 2: v = (v + b) & 0xff; break
        case 3: v = (v + ((a + b) >> 1)) & 0xff; break
        case 4: {
          const p = a + b - c
          const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c)
          const pr = (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c)
          v = (v + pr) & 0xff
          break
        }
        default: throw new Error('[icon] PNG 滤波类型不支持: ' + filter)
      }
      row[x] = v
    }
    prev = row
  }
  return out
}

/** 解析 PNG → { width, height, data: Uint8Array(width*height*4) RGBA } */
function decodePNG(buf) {
  let ihdr = null, palette = null, trns = null
  const idat = []
  for (const c of readChunks(buf)) {
    if (c.type === 'IHDR') ihdr = c.data
    else if (c.type === 'PLTE') palette = c.data
    else if (c.type === 'tRNS') trns = c.data
    else if (c.type === 'IDAT') idat.push(c.data)
  }
  if (!ihdr) throw new Error('[icon] 缺少 IHDR，非有效 PNG')
  const width = ihdr.readUInt32BE(0)
  const height = ihdr.readUInt32BE(4)
  const bitDepth = ihdr[8]
  const colorType = ihdr[9]
  const interlace = ihdr[12]
  if (interlace !== 0) throw new Error('[icon] Adam7 隔行 PNG 不支持')

  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[colorType]
  if (channels === undefined) throw new Error('[icon] 颜色类型不支持: ' + colorType)

  const raw = zlib.inflateSync(Buffer.concat(idat))
  const out = new Uint8Array(width * height * 4)

  if (bitDepth === 8) {
    const dec = defilter(raw, width, height, channels)
    for (let i = 0, p = 0; i < dec.length; i += channels, p += 4) {
      if (colorType === 0) {
        out[p] = out[p + 1] = out[p + 2] = dec[i]; out[p + 3] = 255
      } else if (colorType === 2) {
        out[p] = dec[i]; out[p + 1] = dec[i + 1]; out[p + 2] = dec[i + 2]; out[p + 3] = 255
      } else if (colorType === 3) {
        const idx = dec[i]
        const po = idx * 3
        if (po + 2 < palette.length) {
          out[p] = palette[po]; out[p + 1] = palette[po + 1]; out[p + 2] = palette[po + 2]
        }
        out[p + 3] = trns && idx < trns.length ? trns[idx] : 255
      } else if (colorType === 4) {
        out[p] = out[p + 1] = out[p + 2] = dec[i]; out[p + 3] = dec[i + 1]
      } else {
        out[p] = dec[i]; out[p + 1] = dec[i + 1]; out[p + 2] = dec[i + 2]; out[p + 3] = dec[i + 3]
      }
    }
  } else if (bitDepth === 16) {
    const bpp = channels * 2
    const dec = defilter(raw, width, height, bpp)
    for (let i = 0, p = 0; i < dec.length; i += bpp, p += 4) {
      if (colorType === 0) {
        out[p] = out[p + 1] = out[p + 2] = dec[i]; out[p + 3] = 255
      } else if (colorType === 2) {
        out[p] = dec[i]; out[p + 1] = dec[i + 2]; out[p + 2] = dec[i + 4]; out[p + 3] = 255
      } else if (colorType === 4) {
        out[p] = out[p + 1] = out[p + 2] = dec[i]; out[p + 3] = dec[i + 2]
      } else {
        out[p] = dec[i]; out[p + 1] = dec[i + 2]; out[p + 2] = dec[i + 4]; out[p + 3] = dec[i + 6]
      }
    }
  } else {
    // 亚字节位深（1/2/4）：仅灰度与调色板，按位解包
    const bpp = Math.ceil((channels * bitDepth) / 8)
    const dec = defilter(raw, width, height, bpp)
    const maxv = (1 << bitDepth) - 1
    const mask = maxv
    let i = 0
    for (let y = 0; y < height; y++) {
      const rowStart = y * Math.ceil((width * channels * bitDepth) / 8)
      for (let x = 0; x < width; x++) {
        const bitpos = x * channels * bitDepth
        const byteIdx = rowStart + (bitpos >> 3)
        const shift = 8 - bitDepth - (bitpos & 7)
        const v = (dec[byteIdx] >> shift) & mask
        i = (y * width + x) * 4
        if (colorType === 0) {
          const g = Math.round((v / maxv) * 255)
          out[i] = out[i + 1] = out[i + 2] = g; out[i + 3] = 255
        } else {
          const po = v * 3
          if (po + 2 < palette.length) {
            out[i] = palette[po]; out[i + 1] = palette[po + 1]; out[i + 2] = palette[po + 2]
          }
          out[i + 3] = trns && v < trns.length ? trns[v] : 255
        }
      }
    }
  }
  return { width, height, data: out }
}

// ============ 重采样 ============

/** 面积平均缩小：目标像素覆盖的源区域按重叠面积加权平均（预乘 alpha 空间） */
function areaDownscale(src, sw, sh, dw, dh) {
  const dst = new Uint8Array(dw * dh * 4)
  for (let dy = 0; dy < dh; dy++) {
    const sy0 = (dy * sh) / dh
    const sy1 = ((dy + 1) * sh) / dh
    const ys = Math.floor(sy0)
    const ye = Math.ceil(sy1)
    for (let dx = 0; dx < dw; dx++) {
      const sx0 = (dx * sw) / dw
      const sx1 = ((dx + 1) * sw) / dw
      const xs = Math.floor(sx0)
      const xe = Math.ceil(sx1)
      let r = 0, g = 0, b = 0, a = 0
      for (let y = ys; y < ye; y++) {
        const wy = Math.max(0, Math.min(1, Math.min(y + 1, sy1) - Math.max(y, sy0)))
        for (let x = xs; x < xe; x++) {
          const wx = Math.max(0, Math.min(1, Math.min(x + 1, sx1) - Math.max(x, sx0)))
          const w = wx * wy
          if (w <= 0) continue
          const i = (y * sw + x) * 4
          const al = src[i + 3]
          if (al === 0) continue
          r += src[i] * al * w
          g += src[i + 1] * al * w
          b += src[i + 2] * al * w
          a += al * w
        }
      }
      const o = (dy * dw + dx) * 4
      if (a > 0) {
        dst[o] = Math.round(r / a)
        dst[o + 1] = Math.round(g / a)
        dst[o + 2] = Math.round(b / a)
        dst[o + 3] = Math.min(255, Math.round(a))
      }
    }
  }
  return dst
}

/** 双线性放大：四邻域预乘 alpha 空间内插值 */
function bilinearUpscale(src, sw, sh, dw, dh) {
  const dst = new Uint8Array(dw * dh * 4)
  for (let dy = 0; dy < dh; dy++) {
    const y = ((dy + 0.5) * sh) / dh - 0.5
    const y0 = Math.max(0, Math.floor(y))
    const y1 = Math.min(sh - 1, y0 + 1)
    const fy = y - y0
    for (let dx = 0; dx < dw; dx++) {
      const x = ((dx + 0.5) * sw) / dw - 0.5
      const x0 = Math.max(0, Math.floor(x))
      const x1 = Math.min(sw - 1, x0 + 1)
      const fx = x - x0
      let r = 0, g = 0, b = 0, a = 0
      for (let ty = 0; ty < 2; ty++) {
        for (let tx = 0; tx < 2; tx++) {
          const sx = tx === 0 ? x0 : x1
          const sy = ty === 0 ? y0 : y1
          const w = (tx === 0 ? 1 - fx : fx) * (ty === 0 ? 1 - fy : fy)
          const i = (sy * sw + sx) * 4
          const al = src[i + 3]
          r += src[i] * al * w
          g += src[i + 1] * al * w
          b += src[i + 2] * al * w
          a += al * w
        }
      }
      const o = (dy * dw + dx) * 4
      if (a > 0) {
        dst[o] = Math.round(r / a)
        dst[o + 1] = Math.round(g / a)
        dst[o + 2] = Math.round(b / a)
      }
      dst[o + 3] = Math.round(a)
    }
  }
  return dst
}

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

/** 画布 {size, data} → PNG buffer（RGBA 8bit 非隔行） */
function encodePNG(c) {
  const { size, data } = c
  const stride = size * 4
  const raw = Buffer.alloc(size * (stride + 1))
  for (let y = 0; y < size; y++) {
    const rowStart = y * (stride + 1)
    raw[rowStart] = 0 // filter type 0 (None)
    for (let x = 0; x < stride; x++) raw[rowStart + 1 + x] = data[y * stride + x]
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
    e.writeUInt16LE(1, 4)   // color planes
    e.writeUInt16LE(32, 6)  // bits per pixel
    e.writeUInt32LE(f.png.length, 8)
    e.writeUInt32LE(offset, 12)
    entries.push(e)
    offset += f.png.length
  }
  return Buffer.concat([header, ...entries, ...frames.map(f => f.png)])
}

// ============ ICNS 编码（内嵌 PNG 帧） ============

function encodeICNS(frames) {
  const types = { 16: 'icp4', 32: 'icp5', 64: 'icp6', 128: 'ic07', 256: 'ic08', 512: 'ic09', 1024: 'ic10' }
  const entries = []
  for (const f of frames) {
    const t = types[f.size]
    if (!t) continue
    const head = Buffer.alloc(8)
    head.write(t, 0, 'ascii')
    head.writeUInt32BE(f.png.length + 8, 4)
    entries.push(Buffer.concat([head, f.png]))
  }
  const total = 8 + entries.reduce((s, e) => s + e.length, 0)
  const out = Buffer.alloc(total)
  out.write('icns', 0, 'ascii')
  out.writeUInt32BE(total, 4)
  let off = 8
  for (const e of entries) { e.copy(out, off); off += e.length }
  return out
}

// ============ 主流程 ============

function main() {
  const buildDir = __dirname
  if (!fs.existsSync(SRC)) {
    console.error('[icon] 源图片不存在: ' + SRC)
    console.error('[icon] 请传入源图片路径：node build/generate-icon.js <path-to-png>')
    process.exit(1)
  }

  const { width, height, data } = decodePNG(fs.readFileSync(SRC))

  const resize = (size) => (size <= width && size <= height)
    ? areaDownscale(data, width, height, size, size)
    : bilinearUpscale(data, width, height, size, size)
  const toCanvas = (size) => ({ size, data: resize(size) })

  const icoFrames = ICO_SIZES.map(s => ({ size: s, png: encodePNG(toCanvas(s)) }))
  const ico = encodeICO(icoFrames)
  fs.writeFileSync(path.join(buildDir, 'icon.ico'), ico)

  const pngBig = encodePNG(toCanvas(PNG_SIZE))
  fs.writeFileSync(path.join(buildDir, 'icon.png'), pngBig)

  const icnsFrames = ICNS_SIZES.map(s => ({ size: s, png: encodePNG(toCanvas(s)) }))
  fs.writeFileSync(path.join(buildDir, 'icon.icns'), encodeICNS(icnsFrames))

  // 同步前端 public 副本（favicon 与参考大图）
  fs.copyFileSync(path.join(buildDir, 'icon.ico'), path.join(buildDir, '..', 'frontend', 'public', 'favicon.ico'))
  fs.copyFileSync(path.join(buildDir, 'icon.png'), path.join(buildDir, '..', 'frontend', 'public', 'icon.png'))

  console.log('[icon] 源图:', SRC, '(' + width + 'x' + height + ')')
  console.log('[icon] build/icon.ico 已生成:', ico.length, 'bytes, sizes =', ICO_SIZES.join(','))
  console.log('[icon] build/icon.png 已生成:', pngBig.length, 'bytes, ' + PNG_SIZE + 'x' + PNG_SIZE)
  console.log('[icon] build/icon.icns 已生成:', fs.statSync(path.join(buildDir, 'icon.icns')).size, 'bytes, sizes =', ICNS_SIZES.join(','))
  console.log('[icon] 已同步 frontend/public/favicon.ico 与 frontend/public/icon.png')
}

main()
