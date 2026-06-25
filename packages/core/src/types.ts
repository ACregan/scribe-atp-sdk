export interface ArticleRef {
  uri: string;
  title: string;
  slug?: string;
  splashImageUrl: string | null;
  description?: string | null;
  tags?: string[];
  createdAt: string;
  publishedAt?: string;
  updatedAt?: string;
}

export interface SiteGroup {
  slug: string;
  title: string;
  articles: ArticleRef[];
}

export interface Site {
  title: string;
  url: string;
  urlPrefix: string;
  description?: string;
  splashImageUrl?: string;
  logoImageUrl?: string;
  groups: SiteGroup[];
  ungroupedArticles: ArticleRef[];
}

export interface Article {
  title: string;
  content: string;
  path: string;
  site: string;
  canonicalUrl?: string;
  splashImageUrl?: string;
  description?: string;
  tags?: string[];
  createdAt: string;
  publishedAt: string;
  updatedAt: string;
}

export interface SiteRecord extends Site {
  uri: string;
}
