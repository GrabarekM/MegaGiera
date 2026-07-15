import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1]
const isUserOrOrganizationSite = repositoryName?.endsWith('.github.io')

export default defineConfig({
  base:
    process.env.GITHUB_ACTIONS && repositoryName && !isUserOrOrganizationSite
      ? `/${repositoryName}/`
      : '/',
  plugins: [vue(), tailwindcss()],
})
