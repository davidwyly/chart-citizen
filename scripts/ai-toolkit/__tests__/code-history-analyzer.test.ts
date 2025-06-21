// eslint-disable-next-line @typescript-eslint/no-var-requires
const CodeHistoryAnalyzer = require('../code-history-analyzer');
import { describe, it, expect } from 'vitest';

const SAMPLE_CODE = `
function testFunction() {
  console.log('hello');
}

class MyClass {
  constructor() {}
}
`;

describe('CodeHistoryAnalyzer _findSymbolLineRange', () => {
  it('detects line range for a function', () => {
    const analyzer: any = new CodeHistoryAnalyzer({ debug: false });
    const range = analyzer._findSymbolLineRange(SAMPLE_CODE, 'testFunction');
    expect(range).not.toBeNull();
    expect(range.start).toBe(2); // function starts at line 2 (1-indexed)
    expect(range.end).toBe(4);   // ends at line 4
  });
}); 