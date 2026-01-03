import type { PixelLock } from "./types.js";

const locks = new Map<string,PixelLock>()
const LOCK_DURATION_MS = 5000

export function tryLockPixel(x : number, y : number, userId : number) : PixelLock | null{
    const now = Date.now()
    const key = `${x}:${y}`
    const existing = locks.get(key)

    if(existing && existing.expiresAt > now){
        return null
    }

    const lock : PixelLock ={
        x,
        y,
        ownerId : userId,
        expiresAt : now + LOCK_DURATION_MS
    }

    locks.set(key,lock)
    return lock
}

export function getLock(key :  string){
    return locks.get(key)
}

export function releaseLock(key : string){
    return locks.delete(key)
}

export function getActiveLocks(): PixelLock[] {
  const now = Date.now()
  return Array.from(locks.values()).filter(
    lock => lock.expiresAt > now
  )
}
