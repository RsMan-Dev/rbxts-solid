import bridge from "@rbxts/bridge";
import { Object } from "@rbxts/jsnatives";
import { createEffect, createRoot, on, createMutable, withoutWrap } from "@rbxts/signals";
import { RunService } from "@rbxts/services";

type MutableSyncConstructor<T> = (player?: Player) => () => T;
type Target = Record<string | number | symbol, unknown>

const DELETE = {} as symbol;

function makePatch<T extends object>(current: T, newData: T, patchObject: Partial<T> = {}): Partial<T> {
  const keys = new Set<string | number | symbol>([...Object.keys(current), ...Object.keys(newData)]);

  for (const key of keys) {
    const currentValue = (current as Target)[key];
    const newValue = (newData as Target)[key];

    switch (typeOf(currentValue)) {
      case "function":
      case "thread":
      case "userdata":
      case "buffer":
        break; // Ignore these types, they are not serializable
      case "nil":
        if (newValue !== undefined) {
          (patchObject as Target)[key] = newValue;
        }
        break;
      case "table":
        if (typeOf(newValue) === "table") {
          const nestedPatch = makePatch(currentValue as object, newValue as object);
          if (!Object.isEmpty(nestedPatch)) {
            (patchObject as Target)[key] = nestedPatch;
          }
        } else {
          (patchObject as Target)[key] = newValue;
        }
        break;
      default:
        // Considering all other values are primitives or overrides __eq metamethod
        if (newValue === undefined) {
          (patchObject as Target)[key] = DELETE;
        } else if (currentValue !== newValue) {
          (patchObject as Target)[key] = newValue;
        }
    }
  }

  return patchObject;
}

function applyPatch<T extends object>(target: T, patch: Partial<T>): T {
  for (const entries of Object.entries(patch)) {
    const [key, value] = entries;
    if (typeOf(value) === "table") {
      if (value === DELETE) {
        (target as Target)[key] = undefined;
      } else if (typeOf(target[key]) === "table") {
        (target as Target)[key] = applyPatch((target as Target)[key] as Target, value);
      } else {
        (target as Target)[key] = value;
      }
    } else {
      target[key] = value;
    }
  }
  return target;
}

/**
 * # createSynced
 * createSynced is a function that creates a synced mutable constructor.  
 * Each modifications of the mutable will cause a patch.  
 * Each patch on other side will cause a update of the mutable.  
 * Because data is mutable, it can be edited directly, but:  
 * **if multiple updates are needed at the same time, please use batch, to avoid generating multiple patches**.
 * 
 * Used as a wrapper to {@link bridge.sync} to create a synced mutable between server and client.
 * 
 * Usage:
 * ```ts
 * // shared/usePlayerData.ts
 * // Writeable on both server and client, sync init, non throttled
 * export const usePlayerData = createSynced("playerData", { money: 0, level: 0 });
 * 
 * // server/PlayerData.ts
 * // on Owned context
 * const playerData = usePlayerData(player);
 * setTimeout(() => playerData().money += 1, 1000);
 * createEffect(() => {
 *   print("Level: " + playerData().level); // will print every 100s level + 1
 * })
 * 
 * // client/PlayerData.ts
 * // on Owned context
 * const playerData = usePlayerData();
 * createEffect(() => {
 *   const money = playerData().money;
 *   print(`Money: ${money}`); // will print every second money + 1
 *   if(money > 100) {
 *     batch(() => {
 *       playerData().money = 0;
 *       playerData().level += 1;
 *     });
 *   }
 * })
 * ```
 * 
 * @see {@link bridge.sync}
 * @param useKey The key to use for the sync, must be unique
 * @param init The initial value to use for the sync
 * @param writeableOn If the sync is writeable on server, client or both, default to "client-server"
 * @param asyncInit If the sync is initialized asynchronously or not, default to false
 * @param throttleDelay The delay to use for the sync, default to undefined
 * @returns A getter to the mutable data
 */
const syncs = new Map<string, MutableSyncConstructor<unknown>>();
export function createSynced<T>(useKey: string, init: T, writeableOn: "server" | "client" | "client-server" = "client-server", throttleDelay?: number): MutableSyncConstructor<T> {
  if (syncs.has(useKey)) return syncs.get(useKey) as MutableSyncConstructor<T>;

  const constructor = bridge.sync<T>(useKey, init, writeableOn, true, throttleDelay);

  const constructeds = new Map<Player, () => T>();

  const mutableConstructor = (player?: Player) => {
    const synced = constructor(player), mut = createMutable<{ data: T }>({ data: synced.data });

    if (constructeds.has(synced.player)) return constructeds.get(synced.player) as () => T;

    let patchingMutable = false;

    synced.onUpdated((ctx) => {
      patchingMutable = true;
      mut.data = ctx.data
      patchingMutable = false;
    });

    createRoot(() => {
      createEffect(on(() => makePatch({ data: synced.data }, withoutWrap(mut, false)), (patch) => {
        if (patchingMutable) return;
        synced.patch(data => applyPatch({ data }, patch).data);
      }, { defer: true }))
    })

    return () => mut.data
  }
  syncs.set(useKey, mutableConstructor);
  return mutableConstructor;
}


const globalDatas = new Map<string, () => unknown>();
export function createGlobalSynced<T>(useKey: string, init: T): () => () => T {
  if (globalDatas.has(useKey)) return globalDatas.get(useKey) as () => () => T

  let constructed: (() => T) | undefined = undefined;

  const key = `server_data:${useKey}`

  const constructor = () => {
    if (constructed !== undefined) return constructed;
    const mut = createMutable<{ data: T }>({ data: init });

    if (RunService.IsServer()) {
      createRoot(() => {
        createEffect(() => bridge.broadcast(key, withoutWrap(mut, false).data))
      })
      bridge.on(key, (_, player) => {
        if (player === undefined) return;
        bridge.send(key, withoutWrap(mut, false).data, player)
      })
    } else {
      bridge.on(key, (data, _) => mut.data = data as T)
      bridge.send(key, undefined, undefined, true)
    }

    return () => mut.data
  }
  globalDatas.set(useKey, constructor);

  return constructor as () => () => T;
}
