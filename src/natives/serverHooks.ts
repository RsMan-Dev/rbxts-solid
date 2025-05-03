import { Players, RunService } from "@rbxts/services";
import { clearTimeout, setTimeout } from "@rbxts/jsnatives";
import { createEffect, onCleanup, createMutable, withoutWrap } from "@rbxts/signals";
import type { Store } from "@rbxts/profile-store";

let ProfileStore: {
  New:<Template extends object, RobloxMetadata extends object = object>(
    storeName: string,
    template?: Template,
  ) => Store<Template, RobloxMetadata>
}
if (RunService.IsServer()) {
  import("@rbxts/profile-store").then((ProfileStoreRes) => {
    ProfileStore = ProfileStoreRes
  })
}


export function useStore<T extends object>(defaults = {} as T, uniqueKey = "", player?: Player, eraseAtInit = false) {
  if (RunService.IsClient()) throw "this hook is server only"

  const profileStore = ProfileStore!.New("PlayerData", defaults)
  const session = profileStore.StartSessionAsync(`player_${player?.UserId ?? "server"}_${uniqueKey}`, {
    Cancel: () => player !== undefined ? player.Parent !== Players : false,
  })
  if (player !== undefined) {
    session!.AddUserId(player.UserId)
    session!.Reconcile()
  }

  const value = createMutable({ data: session.Data })

  if (eraseAtInit) value.data = defaults // DEV OLNY, ERASES DATA

  function save(unwrapped: T) {
    if (!session) return
    session.Data = unwrapped
    session.Save()
  }

  let currentTimeout: symbol | undefined, currentSavingValue: T | undefined
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