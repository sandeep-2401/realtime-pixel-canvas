// declare module "ws";
import type { WebSocket as WS } from "ws"

export type Pixel = {
    x : number
    y : number
    color : string
}

export type PixelLock = {
    x : number
    y : number
    ownerId : string
    expiresAt : number
}

export type CanvasSnapshot = {
  pixels: Pixel[]
  locks: PixelLock[]
}

export type UserPresence = {
  userId: string
  name : string
  x: number
  y: number
  lastSeen : number
}

export type RoomState = {
    canvas : Map<string,Pixel>
    locks : Map<string,PixelLock>
    clients : Set<WS>
    presence: Map<string, UserPresence>
    usedNames: Set<string>       
}