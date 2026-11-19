import { describe, it, expect, vi } from 'vitest';
import { processFramePixels, createVideoLightSampler } from '../../src/content/transcript/color-leak.js';

function makePixels(count, rgbaFn) {
  const data = new Uint8ClampedArray(count * 4);
  for (let i = 0; i < count; i++) {
    const [r, g, b, a = 255] = rgbaFn(i);
    data[i * 4] = r;
    data[i * 4 + 1] = g;
    data[i * 4 + 2] = b;
    data[i * 4 + 3] = a;
  }
  return data;
}

describe('transcript color-leak', () => {
  it('ignores pure-black frames so fade-to-black cuts keep the current room colour', () => {
    const black = makePixels(24 * 14, () => [2, 2, 3]);
    const res = processFramePixels(black, null, 24, 14);
    expect(res.changed).toBe(false);
  });

  it('skips frames whose quadrant colours barely changed', () => {
    const frame1 = makePixels(24 * 14, () => [40, 120, 190]);
    const r1 = processFramePixels(frame1, null, 24, 14);
    expect(r1.changed).toBe(true);

    const frame2 = makePixels(24 * 14, () => [42, 121, 188]);
    const r2 = processFramePixels(frame2, r1.sig, 24, 14);
    expect(r2.changed).toBe(false);

    const frame3 = makePixels(24 * 14, () => [210, 95, 50]);
    const r3 = processFramePixels(frame3, r1.sig, 24, 14);
    expect(r3.changed).toBe(true);
  });

  it('lifts dark backgrounds toward the accent colour on mostly-black frames (e.g. slides/diagrams)', () => {
    // 90% black + 10% bright cyan: raw blur would look nearly black without lifting.
    const pixels = makePixels(24 * 14, (i) => (i % 10 === 0 ? [30, 210, 240] : [0, 0, 0]));
    const res = processFramePixels(pixels, null, 24, 14);
    expect(res.changed).toBe(true);
    // Previously black pixel [1] should now carry a noticeable cyan/blue tint (b > r).
    expect(pixels[4 + 2]).toBeGreaterThan(35);
    expect(pixels[4 + 2]).toBeGreaterThan(pixels[4]);
  });

  it('tames blindingly bright white frames so panel text stays readable', () => {
    const white = makePixels(24 * 14, () => [250, 250, 250]);
    const res = processFramePixels(white, null, 24, 14);
    expect(res.changed).toBe(true);
    expect(white[0]).toBeLessThanOrEqual(155);
  });

  it('sampler returns null when video is not ready and returns data URL when ready', () => {
    const fakeCtx = {
      drawImage: vi.fn(),
      getImageData: vi.fn(() => ({
        data: makePixels(24 * 14, () => [180, 70, 120]),
      })),
      putImageData: vi.fn(),
    };
    const fakeCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => fakeCtx),
      toDataURL: vi.fn(() => 'data:image/jpeg;base64,FAKE'),
    };
    const doc = { createElement: vi.fn(() => fakeCanvas) };
    const sampler = createVideoLightSampler({ doc });

    expect(sampler.sample({ readyState: 1, videoWidth: 1920, videoHeight: 1080 })).toBeNull();
    expect(sampler.sample({ readyState: 4, videoWidth: 1920, videoHeight: 1080 })).toBe('data:image/jpeg;base64,FAKE');
    // Identical frame right after -> null (no redundant DOM update)
    expect(sampler.sample({ readyState: 4, videoWidth: 1920, videoHeight: 1080 })).toBeNull();
    sampler.reset();
    expect(sampler.sample({ readyState: 4, videoWidth: 1920, videoHeight: 1080 })).toBe('data:image/jpeg;base64,FAKE');
  });
});
