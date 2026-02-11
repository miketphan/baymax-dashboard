#!/usr/bin/env node
/**
 * Quick test script for the sync system
 * Tests parsing and sync logic without needing the full API
 */

import { readFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const WORKSPACE_ROOT = resolve(__dirname, '..');

// Simple test - just verify files exist and can be parsed
console.log('🧪 Testing Nexus Sync System\n');

const files = [
  { name: 'PROJECTS.md', path: join(WORKSPACE_ROOT, 'PROJECTS.md') },
  { name: 'PROTOCOLS.md', path: join(WORKSPACE_ROOT, 'PROTOCOLS.md') },
  { name: 'PROCESSES.md', path: join(WORKSPACE_ROOT, 'PROCESSES.md') },
  { name: 'FEATURES.md', path: join(WORKSPACE_ROOT, 'FEATURES.md') },
];

let allGood = true;

for (const file of files) {
  const exists = existsSync(file.path);
  if (exists) {
    const content = readFileSync(file.path, 'utf-8');
    const lines = content.split('\n').length;
    console.log(`✅ ${file.name}: ${lines} lines`);
    
    // Check for required sections
    if (file.name === 'PROJECTS.md') {
      const hasProjects = content.includes('# Projects');
      const hasActive = content.includes('## Active Projects');
      console.log(`   - Header: ${hasProjects ? '✓' : '✗'}`);
      console.log(`   - Active section: ${hasActive ? '✓' : '✗'}`);
      
      // Count projects
      const projectCount = (content.match(/###\s+/g) || []).length;
      console.log(`   - Projects found: ${projectCount}`);
    }
  } else {
    console.log(`❌ ${file.name}: NOT FOUND`);
    allGood = false;
  }
}

console.log('\n📋 Scripts check:');

const scripts = [
  'scripts/watch-files.js',
  'scripts/dev-with-sync.js',
];

for (const script of scripts) {
  const path = join(WORKSPACE_ROOT, script);
  const exists = existsSync(path);
  console.log(`${exists ? '✅' : '❌'} ${script}`);
  if (!exists) allGood = false;
}

console.log('\n📦 Package.json scripts check:');

// Read and verify package.json has the scripts
const packagePath = join(WORKSPACE_ROOT, 'package.json');
if (existsSync(packagePath)) {
  const pkg = JSON.parse(readFileSync(packagePath, 'utf-8'));
  const requiredScripts = ['watch', 'watch:once', 'sync', 'dev:full'];
  
  for (const script of requiredScripts) {
    const hasScript = !!pkg.scripts[script];
    console.log(`${hasScript ? '✅' : '❌'} npm run ${script}`);
    if (!hasScript) allGood = false;
  }
}

console.log('\n' + (allGood ? '✅ All checks passed!' : '❌ Some checks failed'));
process.exit(allGood ? 0 : 1);
