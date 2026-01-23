export type Pixel = {
  x: number
  y: number
  color: string
}

export type PixelLock = {
  x: number
  y: number
  ownerId: string
  expiresAt: number
}

export type UserPresence = {
  userId: string
  name : string
  x: number
  y: number
  lastSeen : number
}
