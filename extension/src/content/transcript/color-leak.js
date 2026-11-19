/**
 * Live video "color leak" sampler (modeled on socialmate-hub's Glow + sb-light).
 *
 * Samples the playing <video> onto a tiny 24×14 canvas when the scene changes:
 *   • Skips near-black fade frames so brief cuts don't extinguish the room light.
 *   • Skips frames whose 4-quadrant colour signature barely moved (zero DOM/CSS
 *     work while a static slide or shot stays on screen).
 *   • Lifts mostly-dark frames (diagrams, dark IDEs, night studios) toward their
 *     saturated accent hue so the blur glows with that colour instead of black.
 *   • Tames blindingly bright white frames so panel text keeps crisp contrast.
 */

const WIDTH = 24;
const HEIGHT = 14;
const MIN_CHANNEL = 10;
const SIG_THRESHOLD = 90; // Manhattan distance across 12 quadrant RGB averages
const DARK_FLOOR_LUM = 68;
const TARGET_LIFT_LUM = 92;
const MAX_SAFE_LUM = 145;

/**
 * @param {Uint8ClampedArray} data RGBA pixel buffer (width * height * 4)
 * @param {number[]|null} prevSig Previous 12-value quadrant signature
 * @param {number} [width]
 * @param {number} [height]
 * @returns {{ changed: boolean, sig: number[]|null }}
 */
export function processFramePixels(data, prevSig, width = WIDTH, height = HEIGHT) {
  const total = width * height;
  if (!total || data.length < total * 4) return { changed: false, sig: prevSig };

  const halfX = width >> 1;
  const halfY = height >> 1;
  const qSum = new Float64Array(12);
  const qCnt = new Uint16Array(4);

  let maxCh = 0;
  let lumSum = 0;
  let wSum = 0;
  let wr = 0;
  let wg = 0;
  let wb = 0;

  for (let y = 0; y < height; y++) {
    const qy = y < halfY ? 0 : 2;
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      const hi = r > g ? (r > b ? r : b) : g > b ? g : b;
      const lo = r < g ? (r < b ? r : b) : g < b ? g : b;
      if (hi > maxCh) maxCh = hi;

      const q = qy + (x < halfX ? 0 : 1);
      qSum[q * 3] += r;
      qSum[q * 3 + 1] += g;
      qSum[q * 3 + 2] += b;
      qCnt[q]++;

      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      lumSum += lum;

      const chroma = hi - lo;
      const w = 1 + chroma * 2.6 + (lum > 18 && lum < 235 ? lum * 0.2 : 0);
      wr += r * w;
      wg += g * w;
      wb += b * w;
      wSum += w;
    }
  }

  if (maxCh < MIN_CHANNEL) return { changed: false, sig: prevSig };

  const sig = new Array(12);
  for (let q = 0; q < 4; q++) {
    const c = qCnt[q] || 1;
    sig[q * 3] = Math.round(qSum[q * 3] / c);
    sig[q * 3 + 1] = Math.round(qSum[q * 3 + 1] / c);
    sig[q * 3 + 2] = Math.round(qSum[q * 3 + 2] / c);
  }

  if (prevSig && prevSig.length === 12) {
    let dist = 0;
    for (let k = 0; k < 12; k++) dist += Math.abs(sig[k] - prevSig[k]);
    if (dist < SIG_THRESHOLD) return { changed: false, sig: prevSig };
  }

  const meanLum = lumSum / total;
  if (meanLum < DARK_FLOOR_LUM && wSum > 0) {
    let ar = wr / wSum;
    let ag = wg / wSum;
    let ab = wb / wSum;
    const aLum = Math.max(1, 0.2126 * ar + 0.7152 * ag + 0.0722 * ab);
    const boost = Math.min(3.4, TARGET_LIFT_LUM / aLum);
    ar = Math.min(255, ar * boost);
    ag = Math.min(255, ag * boost);
    ab = Math.min(255, ab * boost);

    for (let i = 0; i < total * 4; i += 4) {
      const lum = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
      const mix = Math.max(0, (78 - lum) / 78) * 0.78;
      if (mix > 0) {
        data[i] = Math.round(data[i] * (1 - mix) + ar * mix);
        data[i + 1] = Math.round(data[i + 1] * (1 - mix) + ag * mix);
        data[i + 2] = Math.round(data[i + 2] * (1 - mix) + ab * mix);
      }
    }
  } else if (meanLum > MAX_SAFE_LUM) {
    const scale = MAX_SAFE_LUM / meanLum;
    for (let i = 0; i < total * 4; i += 4) {
      data[i] = Math.round(data[i] * scale);
      data[i + 1] = Math.round(data[i + 1] * scale);
      data[i + 2] = Math.round(data[i + 2] * scale);
    }
  }

  return { changed: true, sig };
}

/**
 * @param {{ doc?: Document }} [opts]
 */
export function createVideoLightSampler({ doc = document } = {}) {
  let canvas = null;
  let ctx = null;
  let prevSig = null;

  const ensureCanvas = () => {
    if (ctx) return ctx;
    canvas = doc.createElement('canvas');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    ctx = canvas.getContext?.('2d', { willReadFrequently: true }) ?? null;
    return ctx;
  };

  return {
    /** @param {HTMLVideoElement|null} video @returns {string|null} JPEG data URL when colour shifted, else null */
    sample(video) {
      if (!video || !(video.readyState >= 2) || !video.videoWidth || !video.videoHeight) return null;
      const c = ensureCanvas();
      if (!c) return null;
      try {
        c.drawImage(video, 0, 0, WIDTH, HEIGHT);
        const img = c.getImageData(0, 0, WIDTH, HEIGHT);
        const res = processFramePixels(img.data, prevSig, WIDTH, HEIGHT);
        if (!res.changed) return null;
        prevSig = res.sig;
        c.putImageData(img, 0, 0);
        return canvas.toDataURL('image/jpeg', 0.72);
      } catch {
        // Tainted or DRM stream: leave the static thumbnail light untouched.
        return null;
      }
    },
    reset() {
      prevSig = null;
    },
  };
}
