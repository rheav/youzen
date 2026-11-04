import { describe, it, expect } from 'vitest';
import {
  formatTime,
  textOf,
  buildTxt,
  buildSrt,
  buildVtt,
  safeFileName,
} from '../../src/content/transcript/exporters.js';

const cues = [
  { start: 1.5, end: 4, text: 'Hello there.' },
  { start: 4, end: 65.25, text: 'Second line' },
  { start: 3725, end: 3727, text: 'Late one.' },
];
const blocks = [
  { start: 1.5, end: 65.25, from: 0, to: 1 },
  { start: 3725, end: 3727, from: 2, to: 2 },
];
const text = (i) => cues[i].text;
const tr = (i) => ['Olá.', 'Segunda linha', ''][i];

describe('exporters', () => {
  it('formatTime uses m:ss and h:mm:ss', () => {
    expect(formatTime(65.9)).toBe('1:05');
    expect(formatTime(3725)).toBe('1:02:05');
  });

  it('buildTxt with time and translation', () => {
    expect(buildTxt({ blocks, text, time: true, tr })).toBe(
      '0:01\nHello there. Second line\nOlá. Segunda linha\n\n1:02:05\nLate one.',
    );
    expect(buildTxt({ blocks, text, time: false, tr: null })).toBe(
      'Hello there. Second line\n\nLate one.',
    );
  });

  it('buildSrt numbering and comma millis', () => {
    expect(buildSrt({ cues, text, tr: null }).split('\n').slice(0, 5)).toEqual([
      '1',
      '00:00:01,500 --> 00:00:04,000',
      'Hello there.',
      '',
      '2',
    ]);
    expect(buildSrt({ cues, text, tr })).toContain('00:00:04,000 --> 00:01:05,250\nSecond line\nSegunda linha\n');
  });

  it('buildVtt header and dot millis', () => {
    const vtt = buildVtt({ cues, text, tr: null });
    expect(vtt.startsWith('WEBVTT\n\n00:00:01.500 --> 00:00:04.000\nHello there.\n')).toBe(true);
    expect(vtt).toContain('01:02:05.000 --> 01:02:07.000\nLate one.');
  });

  it('edits replace cue text in exports', () => {
    const edited = textOf(cues, { 4000: 'Fixed line' });
    expect(edited(1)).toBe('Fixed line');
    expect(edited(0)).toBe('Hello there.');
    expect(buildTxt({ blocks, text: edited, time: false, tr: null })).toContain('Hello there. Fixed line');
  });

  it('safeFileName strips illegal chars', () => {
    expect(safeFileName('How to: build *great* hooks? / part 2')).toBe('How to build great hooks part 2');
    expect(safeFileName('  ')).toBe('transcript');
  });
});
