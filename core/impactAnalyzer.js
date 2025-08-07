import { simpleGit } from 'simple-git';
import { getImpactedFiles } from "./dependencyGraph.js"

const git = simpleGit();

async function analyzeImpact() {
    const diffFiles = await git.diff(['--name-only', 'origin/master...HEAD']);
    const changedFiles = diffFiles.split('\n').filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));
    //console.log("Changed Files:",changedFiles);
    const result = await getImpactedFiles(changedFiles);
    //console.log("Impacted Files:",result);
    return { changedFiles, impactedFiles: result };
}

export default analyzeImpact;