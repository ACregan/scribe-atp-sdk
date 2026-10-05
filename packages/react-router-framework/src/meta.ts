import type { MetaDescriptor } from "react-router";
import type { Article, Site } from "@skyscribe-sdk/core";
import { generateArticleMeta, generateSiteMeta } from "@skyscribe-sdk/core";

export function articleMeta(article: Article, site: Site): MetaDescriptor[] {
  return generateArticleMeta(article, site) as MetaDescriptor[];
}

export function siteMeta(site: Site): MetaDescriptor[] {
  return generateSiteMeta(site) as MetaDescriptor[];
}
