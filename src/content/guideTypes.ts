export type GuideSection = {
  heading: string
  paragraphs: string[]
}

export type Guide = {
  slug: string
  seoTitle: string
  seoDescription: string
  eyebrow: string
  title: string
  stat: string
  lede: string
  sections: GuideSection[]
  related: string[]
}
