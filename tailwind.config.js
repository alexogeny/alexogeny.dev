module.exports = {
  content: [ './src/**/*.{astro,html,svelte,vue,js,ts,jsx,tsx}' ],
  plugins: [ require('daisyui') ],
  daisyui: {
    themes: [ "dracula", "valentine" ],
    darkTheme: "dracula",
    prefix: "",
    logs: true,
    utils: true,
    styled: true,
    base: true
  }
}
