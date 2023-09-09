import netlify from '@astrojs/netlify/functions'
import { defineConfig } from 'astro/config'

import { remarkReadingTime } from './src/remark-plugins/reading-time.mjs'

export default defineConfig({
  output: 'server',
  adapter: netlify(),
  markdown: {
    remarkPlugins: [ remarkReadingTime ]
  }
})
