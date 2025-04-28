import ProfileStore from "@rbxts/profile-store";
import { Players } from "@rbxts/services";
import { clearTimeout, setTimeout, TimeoutSymbol } from "@rbxts/jsnatives";
import { createEffect, onCleanup, createMutable, withoutWrap } from "@rbxts/signals";


export function useStore<T extends object>(defaults = {} as T, uniqueKey = "", player?: Player, eraseAtInit = false) {
  const profileStore = ProfileStore.New("PlayerData", defaults)
  const session = profileStore.StartSessionAsync(`player_${player?.UserId ?? "server"}_${uniqueKey}`, {
    Cancel: () => player !== undefined ? player.Parent !== Players : false,
  })
  if (player !== undefined) {
    session.AddUserId(player.UserId)
    session.Reconcile()
  }

  const value = createMutable({ data: session.Data })

  if (eraseAtInit) value.data = defaults // DEV OLNY, ERASES DATA

  function save(unwrapped: T) {
    session.Data = unwrapped
    session.Save()
  }

  let currentTimeout: TimeoutSymbol | undefined, currentSavingValue: T | undefined
  function createSave(value: T) {
    currentSavingValue = value
    if (currentTimeout) return
    currentTimeout = setTimeout(() => {
      if (currentSavingValue !== undefined) save(currentSavingValue)
      currentTimeout = undefined
      currentSavingValue = undefined
    }, 1000)
  }

  onCleanup(() => {
    currentTimeout = clearTimeout(currentTimeout) as undefined
    save(withoutWrap(value.data, false))
  })

  createEffect(() => createSave(withoutWrap(value.data, false)))

  return () => value.data
}