import { AstCodeSplitter } from '../ast-splitter';
import { LangChainCodeSplitter } from '../langchain-splitter';

// Test constants
const LARGE_CONTENT_TRACK_COUNT = 50;

describe('SMF File Parsing', () => {
  let astSplitter: AstCodeSplitter;
  let langchainSplitter: LangChainCodeSplitter;

  beforeEach(() => {
    // Initialize splitters with reasonable chunk sizes for testing
    astSplitter = new AstCodeSplitter(2500, 300);
    langchainSplitter = new LangChainCodeSplitter(1000, 200);
  });

  describe('Basic SMF Parsing with LangChain', () => {
    it('should parse simple SMF content', async () => {
      const code = `MThd
Header chunk data
MTrk
Track chunk 1
Delta time: 0
Event: Note On
MTrk
Track chunk 2
Delta time: 0
Event: Note Off
`;

      const chunks = await langchainSplitter.split(code, 'smf', 'test.smf');

      expect(chunks).toBeDefined();
      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[0].metadata.language).toBe('smf');
      expect(chunks[0].metadata.filePath).toBe('test.smf');
    });

    it('should handle .smf file extension', async () => {
      const code = 'MThd\nHeader data\nMTrk\nTrack data';

      const result = await langchainSplitter.split(code, 'smf', 'sample.smf');

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].metadata.language).toBe('smf');
    });

    it('should split large SMF content into chunks', async () => {
      // Create a larger SMF-like content
      let largeContent = 'MThd\nHeader chunk\n\n';
      for (let i = 0; i < LARGE_CONTENT_TRACK_COUNT; i++) {
        largeContent += `MTrk\nTrack ${i}\nDelta time: ${i * 100}\nEvent: Note On\nChannel: ${i % 16}\n\n`;
      }

      const chunks = await langchainSplitter.split(largeContent, 'smf', 'large.smf');

      // Should create multiple chunks for large content
      expect(chunks.length).toBeGreaterThan(1);
      
      // Verify metadata
      chunks.forEach(chunk => {
        expect(chunk.metadata.language).toBe('smf');
        expect(chunk.metadata.filePath).toBe('large.smf');
        expect(chunk.metadata.startLine).toBeGreaterThan(0);
        expect(chunk.metadata.endLine).toBeGreaterThanOrEqual(chunk.metadata.startLine);
        expect(chunk.content.trim()).not.toBe('');
      });
    });
  });

  describe('AST Splitter Fallback for SMF', () => {
    it('should fall back to LangChain splitter for SMF files', async () => {
      const code = `MThd
00 00 00 06
00 01
00 02
00 60
MTrk
00 00 00 0B
00 FF 58 04 04 02 18 08
00 FF 2F 00
`;

      // AST splitter should fall back to LangChain for unsupported languages
      const chunks = await astSplitter.split(code, 'smf', 'test.smf');

      expect(chunks).toBeDefined();
      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[0].metadata.language).toBe('smf');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty SMF content', async () => {
      const chunks = await langchainSplitter.split('', 'smf');

      expect(chunks).toBeDefined();
      expect(Array.isArray(chunks)).toBe(true);
    });

    it('should handle SMF content with only header', async () => {
      const code = 'MThd\n00 00 00 06\n00 01\n00 01\n00 60';

      const chunks = await langchainSplitter.split(code, 'smf', 'header-only.smf');

      expect(chunks).toBeDefined();
      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[0].content).toContain('MThd');
    });

    it('should handle SMF content with special characters', async () => {
      const code = `MThd
Header with special chars: © ® ™
MTrk
Track with unicode: 🎵 🎶 🎼
`;

      const chunks = await langchainSplitter.split(code, 'smf', 'unicode.smf');

      expect(chunks).toBeDefined();
      expect(chunks.length).toBeGreaterThan(0);
    });
  });

  describe('Line Number Tracking', () => {
    it('should track correct line numbers for SMF files', async () => {
      const code = `Line 1: MThd
Line 2: Header data
Line 3: MTrk
Line 4: Track data
Line 5: Event data
`;

      const chunks = await langchainSplitter.split(code, 'smf', 'test.smf');

      expect(chunks.length).toBeGreaterThan(0);
      
      chunks.forEach(chunk => {
        expect(chunk.metadata.startLine).toBeGreaterThan(0);
        expect(chunk.metadata.endLine).toBeGreaterThanOrEqual(chunk.metadata.startLine);
      });
    });
  });

  describe('Content Quality', () => {
    it('should produce non-empty chunks', async () => {
      const code = `MThd
Header chunk data
MTrk
Track chunk data
Event data
More event data
`;

      const chunks = await langchainSplitter.split(code, 'smf');

      chunks.forEach(chunk => {
        expect(chunk.content.trim().length).toBeGreaterThan(0);
        expect(chunk.content).toBeTruthy();
      });
    });

    it('should preserve content structure', async () => {
      const code = `MThd
Header
MTrk
Track 1
MTrk
Track 2`;

      const chunks = await langchainSplitter.split(code, 'smf');

      // All content should be preserved - verify by checking key components
      const allContent = chunks.map(c => c.content).join('');
      expect(allContent).toContain('MThd');
      expect(allContent).toContain('Track 1');
      expect(allContent).toContain('Track 2');
    });
  });
});
