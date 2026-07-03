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
  uri: string;
  title: string;
  url: string;
  urlPrefix: string;
  description?: string;
  splashImageUrl?: string;
  logoImageUrl?: string;
  groups: SiteGroup[];
  ungroupedArticles: ArticleRef[];
}

export interface ArticleContributor {
  did: string;
  role?: string;
  displayName?: string;
}

export interface Article {
  title: string;
  content: string;
  path: string;
  site: string;
  canonicalUrl?: string;
  textContent?: string;
  coverImageUrl?: string;
  description?: string;
  tags?: string[];
  contributors?: ArticleContributor[];
  bskyPostRef?: { uri: string; cid: string };
  createdAt?: string;
  publishedAt: string;
  updatedAt: string;
}

export interface SiteRecord extends Site {}

export interface ArticleResult {
  article: Article;
  uri: string;
}
