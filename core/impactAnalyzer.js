import { execa } from 'execa';
import { getImpactedFiles } from './dependencyGraph.js';

async function analyzeImpact() {
    const { stdout } = await execa('git', ['diff', '--name-only', 'origin/master...HEAD']);
    const changedFiles = stdout
        .split('\n')
        .filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));

    console.log("Changed Files:",changedFiles);

    const impactedFiles = await getImpactedFiles(changedFiles);
    //console.log("Impacted Files:",result);

    return { changedFiles, impactedFiles };
}

export default analyzeImpact;
