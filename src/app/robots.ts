import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/jury/"],
    },
    sitemap: "https://maerika-2k26.jawharathululoomsuffadars.online/sitemap.xml",
  };
}
