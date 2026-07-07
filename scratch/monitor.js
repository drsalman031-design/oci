const { execSync } = require('child_process');
const fs = require('fs');

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('Starting workflow monitor...');
  
  for (let i = 0; i < 30; i++) {
    try {
      execSync('curl.exe -s "https://api.github.com/repos/drsalman031-design/oci/actions/runs" -o "scratch/workflow_runs.json"');
      const data = JSON.parse(fs.readFileSync('scratch/workflow_runs.json', 'utf8'));
      if (data.workflow_runs && data.workflow_runs.length > 0) {
        const latest = data.workflow_runs[0];
        console.log(`[Attempt ${i+1}] Title: "${latest.display_title}" | Status: ${latest.status} | Conclusion: ${latest.conclusion || 'RUNNING'}`);
        if (latest.status === 'completed') {
          console.log(`Workflow finished with conclusion: ${latest.conclusion}`);
          break;
        }
      }
    } catch (e) {
      console.error('Error fetching runs:', e.message);
    }
    await wait(20000); // 20 seconds
  }
}

main().catch(console.error);
