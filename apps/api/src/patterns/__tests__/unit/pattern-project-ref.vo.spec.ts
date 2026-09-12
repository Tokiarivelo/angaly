import {
  generatePatternProjectRef,
  isValidPatternProjectRef,
} from '../../domain/value-objects/pattern-project-ref.vo';

describe('PatternProjectRef Value Object', () => {
  it('should generate valid pattern project ref format', () => {
    const ref = generatePatternProjectRef(new Date('2026-06-15'));
    expect(ref).toMatch(/^ANG-PAT-2026-[A-Z0-9]{8}$/);
    expect(isValidPatternProjectRef(ref)).toBe(true);
  });

  it('should reject invalid references', () => {
    expect(isValidPatternProjectRef('INVALID')).toBe(false);
    expect(isValidPatternProjectRef('ANG-DEV-2026-00001')).toBe(false);
    expect(isValidPatternProjectRef('ANG-PAT-2026-short')).toBe(false);
  });
});
