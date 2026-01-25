import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

// Auto-incrementing build number plugin
function buildNumberPlugin() {
  const file = '.build-number';
  let buildNumber = 0;

  // Read current build number
  if (fs.existsSync(file)) {
    buildNumber = parseInt(fs.readFileSync(file, 'utf8')) || 0;
  }

  // Increment and save
  buildNumber++;
  fs.writeFileSync(file, String(buildNumber));

  console.log(`\n  Build #${buildNumber}\n`);

  return {
    name: 'build-number',
    config() {
      return {
        define: {
          __BUILD_NUMBER__: buildNumber,
        },
      };
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), buildNumberPlugin()],
  base: '/GOOPS/',  // GitHub Pages base path
})
