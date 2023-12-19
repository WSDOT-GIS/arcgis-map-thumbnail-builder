import { defineConfig } from 'vite'
import browserslistToEsbuild from 'browserslist-to-esbuild'

export default defineConfig({
  build: {
    target: browserslistToEsbuild(),
  },
})
