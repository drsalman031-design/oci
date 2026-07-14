const fs = require('fs');
const path = require('path');

const targetFiles = [
  path.join(__dirname, '../App.tsx'),
  path.join(__dirname, '../src/components/Home.tsx'),
  path.join(__dirname, '../src/components/PatientForm.tsx'),
  path.join(__dirname, '../src/components/ClinicPhotoWorkstation.tsx'),
  path.join(__dirname, '../src/components/AiProcessingScreen.tsx'),
  path.join(__dirname, '../src/components/ResultsDashboard.tsx'),
  path.join(__dirname, '../src/components/ReportsPanel.tsx'),
  path.join(__dirname, '../src/components/SettingsPanel.tsx'),
  path.join(__dirname, '../src/components/HistoryList.tsx'),
  path.join(__dirname, '../src/components/LoginScreen.tsx'),
  path.join(__dirname, '../src/components/CephAnalyzer.tsx'),
  path.join(__dirname, '../src/components/AiAssistant.tsx'),
  path.join(__dirname, '../src/components/GoogleDriveSync.tsx'),
  path.join(__dirname, '../src/components/PdfReport.tsx'),
  path.join(__dirname, '../src/components/Splash.tsx'),
  path.join(__dirname, '../src/components/SvgCharts.tsx'),
  path.join(__dirname, '../src/components/TreatmentPlanning.tsx'),
];

// Perform replacements
targetFiles.forEach(filePath => {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace background colors
  content = content.replace(/#071B49/g, '#0A0C10');
  content = content.replace(/#102B5C/g, '#161A20');
  content = content.replace(/#16366A/g, '#161A20');

  // Replace accent colors
  content = content.replace(/#10B7A8/g, '#00E5FF');
  content = content.replace(/#14B8A6/g, '#00E5FF');
  content = content.replace(/#0D9488/g, '#00B8CC'); // darker hover state

  // High contrast traffic-light colors:
  // soft neon green for minimal/positive: #00FF88
  // warm amber for caution: #FFB300
  // vibrant coral-red for severe: #FF4D4D
  content = content.replace(/#2ECC71/g, '#00FF88');
  content = content.replace(/#2ecc71/g, '#00FF88');
  content = content.replace(/#27AE60/g, '#00FF88');
  content = content.replace(/#27ae60/g, '#00FF88');
  content = content.replace(/#F1C40F/g, '#FFB300');
  content = content.replace(/#f1c40f/g, '#FFB300');
  content = content.replace(/#E67E22/g, '#FFB300');
  content = content.replace(/#e67e22/g, '#FFB300');
  content = content.replace(/#E74C3C/g, '#FF4D4D');
  content = content.replace(/#e74c3c/g, '#FF4D4D');
  content = content.replace(/#EF4444/g, '#FF4D4D');
  content = content.replace(/#ef4444/g, '#FF4D4D');
  content = content.replace(/#F59E0B/g, '#FFB300');
  content = content.replace(/#f59e0b/g, '#FFB300');
  content = content.replace(/#10B981/g, '#00FF88');
  content = content.replace(/#10b981/g, '#00FF88');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated theme for: ${filePath}`);
});
console.log('Cyber-Clinical UI theme colors successfully applied!');
