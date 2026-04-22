import type { TerminPublic } from './buchung'

export type TourDifficulty = 'leicht' | 'mittel' | 'schwer'
export type TourVariant = 'alpine-see' | 'hochgebirge' | 'almwiese'

export type TourCardData = {
  id: string
  slug: string
  title: string
  region: string
  difficulty: TourDifficulty
  variant: TourVariant
  distance: string
  ascent: string
  duration: string
}

export type TourGalleryImage = {
  id: string
  title: string | null
  filename_disk: string | null
}

export type TourDetail = TourCardData & {
  subtitle: string | null
  group_size_max: number | null
  intro: string | null
  highlights: string[] | null
  included: string[] | null
  not_included: string[] | null
  meeting_point: string | null
  season: string | null
  price_from: number | null
  booking_url: string | null
  gallery: TourGalleryImage[]
  termine: TerminPublic[]
}
