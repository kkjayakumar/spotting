export const siteConfig = {
  name: "Spotting",
  title: "Spotting",
  description:
    "Modern instant bug reporting platform. An open-source alternative to jam.dev and marker.io.",
  keywords: [
    "bug reporting",
    "bug tracker",
    "issue reporting",
    "developer tools",
    "open source",
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
    repo: "https://github.com/your-org/spotting",
    github: "https://github.com/your-org",
    twitter: "https://x.com/spottingapp",
  },
}

