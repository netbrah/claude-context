#!/usr/bin/env node

/**
 * Generate a markdown table summary from build benchmark results
 * Used in GitHub Actions workflow summaries
 */

const fs = require('fs');
const path = require('path');

const BENCHMARK_FILE = process.argv[2] || 'build-benchmark.json';

try {
  const data = JSON.parse(fs.readFileSync(BENCHMARK_FILE, 'utf8'));
  const latest = data[data.length - 1];
  
  console.log('| Package | Duration | Status |');
  console.log('|---------|----------|--------|');
  
  latest.results.forEach(r => {
    const status = r.success ? '✅' : '❌';
    const duration = (r.duration / 1000).toFixed(2) + 's';
    console.log(`| ${r.description} | ${duration} | ${status} |`);
  });
  
  const total = (latest.results.reduce((sum, r) => sum + r.duration, 0) / 1000).toFixed(2);
  console.log(`| **Total** | **${total}s** | - |`);
  
} catch (error) {
  console.error('Error generating benchmark summary:', error.message);
  process.exit(1);
}
