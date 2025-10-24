import { AstCodeSplitter } from '../ast-splitter';
import { CodeChunk } from '../index';
import * as fs from 'fs';
import * as path from 'path';

describe('AstCodeSplitter - Perl (.thpl) Parsing', () => {
  let splitter: AstCodeSplitter;
  const fixturesDir = path.join(__dirname, 'fixtures');

  beforeEach(() => {
    // Initialize splitter with reasonable chunk sizes for testing
    splitter = new AstCodeSplitter(2500, 300);
  });

  describe('Basic Perl Parsing', () => {
    it('should parse simple Perl code', async () => {
      const code = `#!/usr/bin/perl
use strict;
use warnings;

sub hello {
    print "Hello, World!\\n";
}

sub add {
    my ($a, $b) = @_;
    return $a + $b;
}
`;

      const chunks = await splitter.split(code, 'perl', 'test.thpl');

      expect(chunks).toBeDefined();
      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[0].metadata.language).toBe('perl');
      expect(chunks[0].metadata.filePath).toBe('test.thpl');
    });

    it('should parse simple.thpl fixture', async () => {
      const code = fs.readFileSync(
        path.join(fixturesDir, 'simple.thpl'),
        'utf-8'
      );

      const chunks = await splitter.split(code, 'perl', 'simple.thpl');

      expect(chunks).toBeDefined();
      expect(chunks.length).toBeGreaterThan(0);
      
      // Should contain the greet function
      const hasFunction = chunks.some(chunk => 
        chunk.content.includes('greet')
      );
      expect(hasFunction).toBe(true);
    });

    it('should handle .thpl file extension', async () => {
      const code = 'sub test { return 1; }';

      const result = await splitter.split(code, 'perl', 'test.thpl');

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].metadata.language).toBe('perl');
    });
  });

  describe('Subroutine Parsing', () => {
    it('should extract subroutine definitions', async () => {
      const code = `
sub print_hello {
    print "Hello\\n";
}

sub calculate {
    my ($a, $b) = @_;
    return $a + $b;
}

sub process_data {
    my ($data) = @_;
    return uc($data);
}
`;

      const chunks = await splitter.split(code, 'perl');

      // Since Perl doesn't have tree-sitter support, it will use LangChain splitter
      expect(chunks.length).toBeGreaterThan(0);
      
      // Check that subroutines are in the chunks
      const allContent = chunks.map(c => c.content).join('\n');
      expect(allContent).toContain('print_hello');
      expect(allContent).toContain('calculate');
      expect(allContent).toContain('process_data');
    });

    it('should parse subroutines with complex signatures', async () => {
      const code = `
sub max {
    my ($a, $b) = @_;
    return ($a > $b) ? $a : $b;
}

sub callback {
    my ($func, $value) = @_;
    $func->($value);
}

sub get_numbers {
    return (1, 2, 3, 4, 5);
}
`;

      const chunks = await splitter.split(code, 'perl');

      expect(chunks.length).toBeGreaterThan(0);
      
      // Check for any subroutine presence
      const allContent = chunks.map(c => c.content).join('\n');
      expect(allContent).toContain('max');
    });
  });

  describe('Package Parsing', () => {
    it('should extract package definitions', async () => {
      const code = `
package SimplePackage;
use strict;
use warnings;

sub new {
    my $class = shift;
    return bless {}, $class;
}

sub get_value {
    my $self = shift;
    return $self->{value};
}

package AnotherPackage;

sub helper {
    return 42;
}

1;
`;

      const chunks = await splitter.split(code, 'perl');

      expect(chunks.length).toBeGreaterThan(0);
      
      const allContent = chunks.map(c => c.content).join('\n');
      expect(allContent).toContain('SimplePackage');
      expect(allContent).toContain('AnotherPackage');
    });

    it('should parse packages with inheritance', async () => {
      const code = `
package Base;

sub new {
    my $class = shift;
    return bless {}, $class;
}

package Derived;
use parent 'Base';

sub action {
    my $self = shift;
    # Implementation
}

1;
`;

      const chunks = await splitter.split(code, 'perl');

      expect(chunks.length).toBeGreaterThan(0);
      
      const allContent = chunks.map(c => c.content).join('\n');
      expect(allContent).toContain('Base');
      expect(allContent).toContain('Derived');
    });
  });

  describe('Sample Files', () => {
    it('should parse sample.thpl completely', async () => {
      const code = fs.readFileSync(
        path.join(fixturesDir, 'sample.thpl'),
        'utf-8'
      );

      const chunks = await splitter.split(code, 'perl', 'sample.thpl');

      expect(chunks).toBeDefined();
      expect(chunks.length).toBeGreaterThan(0);
      
      // Verify metadata
      chunks.forEach(chunk => {
        expect(chunk.metadata.language).toBe('perl');
        expect(chunk.metadata.filePath).toBe('sample.thpl');
        expect(chunk.metadata.startLine).toBeGreaterThan(0);
        expect(chunk.metadata.endLine).toBeGreaterThanOrEqual(chunk.metadata.startLine);
        expect(chunk.content.trim()).not.toBe('');
      });

      // Check for key components
      const allContent = chunks.map(c => c.content).join('\n');
      expect(allContent).toContain('Calculator');
      expect(allContent).toContain('MathUtils');
    });

    it('should parse complex.thpl with all constructs', async () => {
      const code = fs.readFileSync(
        path.join(fixturesDir, 'complex.thpl'),
        'utf-8'
      );

      const chunks = await splitter.split(code, 'perl', 'complex.thpl');

      expect(chunks).toBeDefined();
      expect(chunks.length).toBeGreaterThan(0);

      // Verify various Perl constructs are captured
      const allContent = chunks.map(c => c.content).join('\n');
      
      // Check for packages
      expect(allContent).toContain('Shape');
      expect(allContent).toContain('Rectangle');
      expect(allContent).toContain('Circle');
      
      // Check for utility packages
      expect(allContent).toContain('StringUtils');
      expect(allContent).toContain('ArrayUtils');
    });
  });

  describe('Chunk Size Management', () => {
    it('should respect chunk size limits', async () => {
      const splitterSmall = new AstCodeSplitter(500, 50);
      
      const code = fs.readFileSync(
        path.join(fixturesDir, 'complex.thpl'),
        'utf-8'
      );

      const chunks = await splitterSmall.split(code, 'perl');

      // Each chunk should be reasonably sized
      chunks.forEach(chunk => {
        // Allow some buffer over the limit for overlap
        expect(chunk.content.length).toBeLessThan(1000);
      });
    });

    it('should handle chunk overlap', async () => {
      const splitterWithOverlap = new AstCodeSplitter(1000, 200);
      
      const code = `
sub function1 {
    return 1;
}

sub function2 {
    return 2;
}

sub function3 {
    return 3;
}
`;

      const chunks = await splitterWithOverlap.split(code, 'perl');

      expect(chunks.length).toBeGreaterThan(0);
      
      // Verify chunks are created
      chunks.forEach(chunk => {
        expect(chunk.content.trim()).not.toBe('');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty code', async () => {
      const chunks = await splitter.split('', 'perl');

      expect(chunks).toBeDefined();
      // Empty code may return empty array with LangChain splitter
      expect(Array.isArray(chunks)).toBe(true);
    });

    it('should handle code with only comments', async () => {
      const code = `
# This is a comment
# Another comment
=pod
Multi-line comment
in POD format
=cut
`;

      const chunks = await splitter.split(code, 'perl');

      expect(chunks).toBeDefined();
      expect(chunks.length).toBeGreaterThan(0);
    });

    it('should handle malformed code gracefully', async () => {
      const code = `
sub incomplete {
# Missing closing brace
`;

      // Should not throw
      const chunks = await splitter.split(code, 'perl');

      expect(chunks).toBeDefined();
      expect(chunks.length).toBeGreaterThan(0);
    });

    it('should handle very long lines', async () => {
      const longLine = 'my $result = ' + '"a" . '.repeat(1000) + '"b";';
      
      const chunks = await splitter.split(longLine, 'perl');

      expect(chunks).toBeDefined();
      expect(chunks.length).toBeGreaterThan(0);
    });
  });

  describe('Line Number Tracking', () => {
    it('should track correct line numbers', async () => {
      const code = `# Line 1
# Line 2
sub function1 {  # Line 3
    return 1;    # Line 4
}                # Line 5
                 # Line 6
sub function2 {  # Line 7
    return 2;    # Line 8
}                # Line 9
`;

      const chunks = await splitter.split(code, 'perl', 'test.thpl');

      expect(chunks.length).toBeGreaterThan(0);
      
      chunks.forEach(chunk => {
        expect(chunk.metadata.startLine).toBeGreaterThan(0);
        expect(chunk.metadata.endLine).toBeGreaterThanOrEqual(chunk.metadata.startLine);
      });
    });

    it('should maintain line number continuity', async () => {
      const code = fs.readFileSync(
        path.join(fixturesDir, 'sample.thpl'),
        'utf-8'
      );

      const chunks = await splitter.split(code, 'perl', 'sample.thpl');

      // Line numbers should be reasonable
      chunks.forEach((chunk, index) => {
        expect(chunk.metadata.startLine).toBeGreaterThan(0);
        expect(chunk.metadata.endLine).toBeGreaterThan(0);
        
        if (index > 0) {
          const prevChunk = chunks[index - 1];
          // Current chunk should not start before previous chunk started (allowing for overlap)
          expect(chunk.metadata.startLine).toBeGreaterThanOrEqual(
            prevChunk.metadata.startLine - 50
          );
        }
      });
    });
  });

  describe('Configuration', () => {
    it('should allow updating chunk size', () => {
      const initialSize = 2500;
      const newSize = 5000;
      
      const s = new AstCodeSplitter(initialSize, 300);
      s.setChunkSize(newSize);
      
      // Configuration updated successfully (no error thrown)
      expect(s).toBeDefined();
    });

    it('should allow updating chunk overlap', () => {
      const s = new AstCodeSplitter(2500, 300);
      s.setChunkOverlap(500);
      
      // Configuration updated successfully (no error thrown)
      expect(s).toBeDefined();
    });
  });

  describe('Language Support Detection', () => {
    it('should indicate Perl is not directly supported by AST splitter', () => {
      // Perl doesn't have tree-sitter support, so it's not in the AST-supported list
      expect(AstCodeSplitter.isLanguageSupported('perl')).toBe(false);
    });

    it('should fall back to LangChain splitter for Perl', async () => {
      const code = 'sub test { return 1; }';
      
      // Should not throw, will use fallback
      const chunks = await splitter.split(code, 'perl', 'test.thpl');
      
      expect(chunks).toBeDefined();
      expect(chunks.length).toBeGreaterThan(0);
    });
  });

  describe('Content Quality', () => {
    it('should produce non-empty chunks', async () => {
      const code = fs.readFileSync(
        path.join(fixturesDir, 'sample.thpl'),
        'utf-8'
      );

      const chunks = await splitter.split(code, 'perl');

      chunks.forEach(chunk => {
        expect(chunk.content.trim().length).toBeGreaterThan(0);
        expect(chunk.content).toBeTruthy();
      });
    });

    it('should preserve code structure', async () => {
      const code = `
package Test;

sub method {
    # Content
    return 1;
}

1;
`;

      const chunks = await splitter.split(code, 'perl');

      // At least one chunk should contain the package structure
      const allContent = chunks.map(c => c.content).join('\n');
      expect(allContent).toContain('package Test');
      expect(allContent).toContain('method');
    });
  });

  describe('File Extension Handling', () => {
    it('should handle .pl extension', async () => {
      const code = 'sub test { return 1; }';
      const chunks = await splitter.split(code, 'perl', 'test.pl');
      
      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[0].metadata.language).toBe('perl');
      expect(chunks[0].metadata.filePath).toBe('test.pl');
    });

    it('should handle .pm extension', async () => {
      const code = 'package MyModule; sub test { return 1; } 1;';
      const chunks = await splitter.split(code, 'perl', 'MyModule.pm');
      
      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[0].metadata.language).toBe('perl');
      expect(chunks[0].metadata.filePath).toBe('MyModule.pm');
    });

    it('should handle .thpl extension', async () => {
      const code = 'sub test { return 1; }';
      const chunks = await splitter.split(code, 'perl', 'test.thpl');
      
      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[0].metadata.language).toBe('perl');
      expect(chunks[0].metadata.filePath).toBe('test.thpl');
    });
  });
});
