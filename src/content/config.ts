import { defineCollection, reference, z } from 'astro:content';

const posts = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    draft: z.boolean().optional(),
    image: z.object({
      url: z.string(),
      alt: z.string()
    }).optional(),
    tags: z.array(z.string()),
    date: z.string(),
    snippet: z.string(),
    author: reference('authors')
  }),
});

const authors = defineCollection({
  type: 'data',
  schema: z.object({
    name: z.string(),
    avatar: z.string(),
    bio: z.string(),
    socials: z.array(z.object({
      name: z.string(),
      url: z.string(),
    })),
    website: z.string(),
  }),
})

export const collections = {
  posts, authors
};
