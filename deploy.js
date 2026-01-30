import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function deployProjects(projectsData) {
  try {
    // Paths
    const frontendPublicPath = path.join(__dirname, '..', 'frontend', 'public', 'projects.json');
    const frontendDir = path.join(__dirname, '..', 'frontend');
    
    // Write projects.json to frontend/public
    await fs.writeFile(frontendPublicPath, JSON.stringify(projectsData, null, 2));
    console.log('✅ Projects saved to frontend/public/projects.json');
    
    // Build frontend
    console.log('📦 Building frontend...');
    const { stdout: buildOutput, stderr: buildError } = await execAsync('npm run build', {
      cwd: frontendDir,
      shell: true
    });
    
    if (buildError && !buildError.includes('warning')) {
      throw new Error(`Build failed: ${buildError}`);
    }
    console.log('✅ Build successful!');
    
    // Deploy to Surge
    console.log('🌐 Deploying to Surge...');
    const { stdout: deployOutput, stderr: deployError } = await execAsync('surge dist falcon-portfolio.surge.sh', {
      cwd: frontendDir,
      shell: true
    });
    
    if (deployError && !deployError.includes('warning')) {
      throw new Error(`Deploy failed: ${deployError}`);
    }
    console.log('✅ Deployment successful!');
    
    return {
      success: true,
      message: 'Projects deployed successfully!',
      url: 'https://falcon-portfolio.surge.sh'
    };
  } catch (error) {
    console.error('Deployment error:', error);
    return {
      success: false,
      message: error.message || 'Deployment failed'
    };
  }
}

