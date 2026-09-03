import type { MetadataRoute } from "next";
export default function sitemap():MetadataRoute.Sitemap{const base=process.env.NEXT_PUBLIC_SITE_URL??"https://tivorah.com";return ["","/about","/privacy","/terms","/community-guidelines","/account-deletion"].map(path=>({url:`${base}${path}`,lastModified:new Date()}))}
