import { describe, it, expect } from 'vitest';
import { newRuleId } from '@/utils/rule-id';

describe('newRuleId', () => {
  it('returns a string of the expected shape', () => {
    const id = newRuleId();
    expect(typeof id).toBe('string');
    expect(id).toMatch(/^r_[a-z0-9]{8}_[a-z0-9]{4}$/);
  });

  it('produces unique ids across 1000 rapid calls', () => {
    const seen = new Set();
    for (let i = 0; i < 1000; i += 1) seen.add(newRuleId());
    expect(seen.size).toBe(1000);
  });
});
