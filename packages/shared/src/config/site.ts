export const siteConfig = {
  name: "Spotting",
  title: "Spotting",
  description:
    "Capture bugs with recordings, console logs, and network traces — then triage them with your team.",
  keywords: [
    "bug reporting",
    "bug tracker",
    "issue reporting",
    "QA tools",
    "screen recording",
  ],
  seo: {
    titleTemplate: "%s | Spotting",
    canonicalPath: "/",
    locale: "en_US",
    openGraphType: "website" as const,
    twitterCard: "summary_large_image" as const,
    defaultOgImage: "/og.png",
  },
  author: {
    name: "Spotting",
    twitter: "@spottingapp",
  },
  links: {
    repo: "https://github.com/kkjayakumar/spotting",
    github: "https://github.com/kkjayakumar",
    twitter: "https://x.com/spottingapp",
  },
}
