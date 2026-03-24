import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

const buildVersionPlugin = () => ({
  name: 'build-version',
  buildStart() {
    fs.writeFileSync('./public/version.json', JSON.stringify({ v: Date.now() }));
  },
});

export default defineConfig({
  plugins: [react(), buildVersionPlugin()],
})
