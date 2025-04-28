import { Players, RunService } from "@rbxts/services";
import { clearTimeout, Object, setTimeout, TimeoutSymbol } from "@rbxts/jsnatives";
import { createEffect, onCleanup, createMutable, withoutWrap } from "@rbxts/signals";
import type { Profile } from "@rbxts/profile-store";

export function useStore<T extends object>(defaults = {} as T, uniqueKey = "", player?: Player, eraseAtInit = false) {
  if (RunService.IsClient()) throw "this hook is server only"

  let value = createMutable({ data: Object.dup(defaults, true) })
  let session: Profile<T, object> | undefined

  import("@rbxts/profile-store").then((ProfileStore) => {
    const profileStore = ProfileStore.New("PlayerData", defaults)
    session = profileStore.StartSessionAsync(`player_${player?.UserId ?? "server"}_${uniqueKey}`, {
      Cancel: () => player !== undefined ? player.Parent !== Players : false,
    })
    if (player !== undefined) {
      session!.AddUserId(player.UserId)
      session!.Reconcile()
    }
  })

  if (eraseAtInit) value.data = defaults // DEV OLNY, ERASES DATA

  function save(unwrapped: T) {
    if (!session) return
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