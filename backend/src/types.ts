export type Pixel = {
    x : number
    y : number
    color : string
}

export type PixelLock = {
    x : number
    y : number
    ownerId : number
    expiresAt : number
}

export type CanvasSnapshot = {
  pixels: Pixel[]
  locks: PixelLock[]
}
