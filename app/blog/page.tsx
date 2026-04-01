import { client } from '@/sanity/lib/client'
import { ALL_ARTICLES_QUERY } from '@/sanity/lib/queries'
import BlogClient from './BlogClient'

export const dynamic = 'force-dynamic'

export default async function BlogPage() {
  const articles = await client.fetch(ALL_ARTICLES_QUERY)
  return <BlogClient articles={articles} />
}