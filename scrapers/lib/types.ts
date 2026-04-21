export type VenueConfig = {
  name: string
  slug: string
  url: string
}

export type ScrapedShow = {
  title: string
  slug: string
  date: string
  time: string
  price: string
  genre: string
  excerpt: string
  image: string
  ticketUrl?: string
  previewUrl?: string
  previewTrack?: string
}
