import { getAsset } from "./utils/permalinks";
export const headerData = {
  links: [
    {
      text: "Home",
      href: "/#",
    },
    {
      text: "About",
      href: "/#about",
    },
    {
      text: "Resume",
      href: "/#resume",
    },
    {
      text: "Porfolio",
      href: "/#porfolio",
    },
    {
      text: "Blog",
      href: "/blog",
    },
  ],
  actions: [],
};

export const footerData = {
  socialLinks: [
    { ariaLabel: "X", icon: "tabler:brand-x", href: "https://x.com/alexogeny" },
    {
      ariaLabel: "Discord",
      icon: "tabler:brand-discord",
      href: "https://discord.com/users/305879281580638228",
    },
    {
      ariaLabel: "Github",
      icon: "tabler:brand-github",
      href: "https://github.com/alexogeny",
      target: "_blank",
    },
    { ariaLabel: "RSS", icon: "tabler:rss", href: getAsset("/rss.xml") },
  ],
  footNote: `
    powered by <a class="dark:text-white" href="https://astro.build" _target="blank" rel="noopener noreferrer">astro</a> and <a class="dark:text-white" href="https://tailwindcss.com" _target="blank" rel="noopener noreferrer">tailwindcss</a>
  `,
};
