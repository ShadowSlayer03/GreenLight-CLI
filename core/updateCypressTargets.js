import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { getImpactedFiles } from './dependencyGraph.js';

const CYPRESS_TARGET_PATH = path.resolve('cypress-target-spec.json');
const CYPRESS_TEST_DIR = path.resolve('cypress/component');

const componentToSpec = (componentPath) => {
  const fileName = path.basename(componentPath).replace(/\.[jt]sx?$/, '');
  const specFile = path.join(CYPRESS_TEST_DIR, `${fileName}.cy.tsx`);
  return fs.existsSync(specFile) ? specFile : null;
};

async function updateCypressTargets() {
  const targetSpec = JSON.parse(fs.readFileSync(CYPRESS_TARGET_PATH, 'utf8'));

  const changedFiles = execSync('git diff --name-only HEAD', { encoding: 'utf-8' })
    .split('\n')
    .filter(f => f.trim().endsWith('.tsx') || f.trim().endsWith('.ts'))
    .map(f => f.replace(/\\/g, '/'));

  if (!changedFiles.length) return;

  // Use existing function to get impacted files
  const impacted = await getImpactedFiles(changedFiles);

  const impactedSpecs = new Set();
  for (const file of impacted) {
    const specPath = componentToSpec(file.replace(/\\/g, '/'));
    if (specPath) {
      impactedSpecs.add(path.resolve(specPath).replace(/\\/g, '/'));
    }
  }

  const updated = {};
  for (const spec of Object.keys(targetSpec)) {
    const resolvedSpec = path.resolve(spec).replace(/\\/g, '/');
    updated[spec] = impactedSpecs.has(resolvedSpec);
  }

  fs.writeFileSync(CYPRESS_TARGET_PATH, JSON.stringify(updated, null, 2));
  console.log(`✅ Cypress targets updated: ${impactedSpecs.size} impacted test(s).`);
}

export default updateCypressTargets;
