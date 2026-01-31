const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const envLocalPath = path.join(process.cwd(), '.env.local');
const envLocalBackupPath = path.join(process.cwd(), '.env.local.backup');
const envProdPath = path.join(process.cwd(), '.env.prod');
const envProductionPath = path.join(process.cwd(), '.env.production');

let envLocalBackedUp = false;

try {
  // Step 1: Backup .env.local if it exists
  if (fs.existsSync(envLocalPath)) {
    console.log('Backing up .env.local...');
    fs.renameSync(envLocalPath, envLocalBackupPath);
    envLocalBackedUp = true;
  }

  // Step 2: Copy .env.prod to .env.production
  if (fs.existsSync(envProdPath)) {
    console.log('Copying .env.prod to .env.production...');
    fs.copyFileSync(envProdPath, envProductionPath);
    console.log('Using .env.prod for build');
  } else {
    console.warn('Warning: .env.prod not found!');
  }

  // Step 3: Run the build
  console.log('Starting Next.js build...');
  execSync('next build', { stdio: 'inherit' });

  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
} finally {
  // Step 4: Restore .env.local if it was backed up
  if (envLocalBackedUp && fs.existsSync(envLocalBackupPath)) {
    console.log('Restoring .env.local...');
    fs.renameSync(envLocalBackupPath, envLocalPath);
  }

  // Step 5: Clean up .env.production (optional - you can keep it if you want)
  // Uncomment the next lines if you want to remove .env.production after build
  // if (fs.existsSync(envProductionPath)) {
  //   fs.unlinkSync(envProductionPath);
  // }
}
