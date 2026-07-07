const fs = require('fs');

try {
  const data = JSON.parse(fs.readFileSync('scratch/workflow_jobs.json', 'utf8'));
  if (data.jobs && data.jobs.length > 0) {
    const job = data.jobs[0];
    console.log('Job Name:', job.name);
    console.log('Status:', job.status);
    console.log('Conclusion:', job.conclusion);
    console.log('Steps:');
    job.steps.forEach(s => {
      console.log(`- [${s.conclusion || s.status}] ${s.name} (${s.number})`);
    });
  } else {
    console.log('No jobs found.');
  }
} catch (e) {
  console.error(e);
}
