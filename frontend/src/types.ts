export type Pixel = {
  x: number
  y: number
  color: string
}

export type PixelLock = {
  x: number
  y: number
  ownerId: number
  expiresAt: number
}
export type UserPresence = {
  userId: number
  name : string
  x: number
  y: number
  lastSeen : number
}
