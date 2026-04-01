export const ALL_ARTICLES_QUERY = `
  *[_type == "article" && defined(publishedAt) && publishedAt <= now()] 
  | order(publishedAt desc) {
    _id,
    title,
    "slug": slug.current,
    excerpt,
    category,
    readTime,
    featured,
    publishedAt,
  }
`

export const ARTICLE_BY_SLUG_QUERY = `
  *[_type == "article" && slug.current == $slug][0] {
    _id,
    title,
    "slug": slug.current,
    excerpt,
    body,
    category,
    readTime,
    featured,
    publishedAt,
  }
`

export const RELATED_ARTICLES_QUERY = `
  *[_type == "article" && defined(publishedAt) && publishedAt <= now() && category == $category && slug.current != $slug]
  | order(publishedAt desc)[0..2] {
    _id,
    title,
    "slug": slug.current,
    excerpt,
    category,
    readTime,
    publishedAt,
  }
`

export const LATEST_ARTICLES_QUERY = `
  *[_type == "article" && defined(publishedAt) && publishedAt <= now() && slug.current != $slug]
  | order(publishedAt desc)[0..4] {
    _id,
    title,
    "slug": slug.current,
    category,
    readTime,
    publishedAt,
  }
`