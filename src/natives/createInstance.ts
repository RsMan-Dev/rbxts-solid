import { createEffect, onCleanup, untrack, createContext, getOwner, disposeNode, createComputation } from "@rbxts/signals"
import { Workspace } from "@rbxts/services"
import type { SOLIDTYPE } from "../rendering"
import { ArrayUtils, Object } from "@rbxts/jsnatives"

type SignalFunction<T, A extends any[] = any[], Cb extends Callback = Callback> = {
  (this: T, ...args: A): RBXScriptSignal<Cb>
}

// 
type SignalAttribute<Cb extends Callback = Callback> = RBXScriptSignal<Cb>

type GetterKey<T extends string> = `Get${T}`
type SetterKey<T extends string> = `Set${T}`


type InstanceOtherAttributes<T> = {
  [key in keyof T as T[key] extends (...args: any[]) => any
  ? never : T[key] extends SignalAttribute
  ? never : key
  ]: T[key]
}

type InstanceFunctions<T> = {
  [key in keyof T as T[key] extends (...args: any[]) => any
  ? T[key] extends SignalFunction<T>
  ? never : key extends GetterKey<infer N>
  ? `get:${N}` : key extends SetterKey<infer N>
  ? `set:${N}` : key extends string
  ? `fn:${key}` : never
  : never]: T[key] extends (...args: infer A) => infer R
  ? ((method: (...args: A) => R) => void) | (A extends [infer A1] ? A1 extends [] ? A | Readonly<A> : A1 : A | Readonly<A>)
  : never
}

type EventPrefixes<T> = T extends string ? `on:${T}` | `once:${T}` | `parallel:${T}` : never
type EventCallback<T, Cb extends Callback> = Cb extends (...args: infer A) => infer R ? (inst: T, ...args: A) => R : never
type InstanceEvents<T> = {
  [key in keyof T as T[key] extends SignalAttribute
  ? EventPrefixes<key> : T[key] extends SignalFunction<T>
  ? EventPrefixes<key> : never
  ]: T[key] extends SignalFunction<T, infer A, infer R>
  ? key extends "GetPropertyChangedSignal" // => special case for GetPropertyChangedSignal, as it is a function is generic, its parameters are computed from the generic type
  ? [Exclude<ExcludeKeys<T, symbol | Callback | RBXScriptSignal<Callback>>, "Changed">, EventCallback<T, R>]
  : [...A, EventCallback<T, R>]
  : T[key] extends SignalAttribute<infer Cb>
  ? EventCallback<T, Cb> : never
}

export type TransformedInstanceAttributes<T extends InstanceMap[keyof InstanceMap]> = {
  Children?: JSX.Element,
  Ref?: (ref: T) => void | T
} &
  Partial<
    InstanceOtherAttributes<T> &
    InstanceEvents<T> &
    InstanceFunctions<T>
  >

export const InstanceContext: ReturnType<typeof createContext<Instance | undefined>> = createContext<Instance | undefined>(undefined)

export function runWithInstance<R, T extends Instance | undefined>(instance: T, callback: () => R): R {
  return InstanceContext.apply(instance, callback)
}

export function getInstance<T extends Instance | undefined>(): T {
  return InstanceContext.getValue() as T
}

export function ProvideInstance(props: { Children: () => JSX.Element, Value: Instance }) {
  return InstanceContext.Provider(props)
}

export default function createInstance(
  SOLID: SOLIDTYPE,
  key: unknown,
  attributes: Record<string, unknown>,
  ...children: ((() => JSX.Element) | JSX.Element)[]
): Instance | undefined {
  if (!(typeIs(key, "string") && key.find("^inst")[0] !== undefined) && !typeIs(key, "Instance")) return undefined

  let element: Instance, parent = getInstance<Instance>(), destroyable = false

  if (!typeIs(parent, "Instance")) {
    if (parent !== undefined) print(`[SOLID] Tried to create an instance with a non-instance parent, fallbacked to Workspace`, parent)
    parent = Workspace // defaulted to workspace, ensure the instance would have parent, to have tangible elemnts in game
  }

  if (typeIs(key, "string")) { // needs creation
    element = new Instance(key.sub(5) as keyof CreatableInstances, parent)
    SOLID.createDebug(`Creating new instance element`)
    destroyable = true
  } else element = key // just binding

  return InstanceContext.apply(element, () => {
    SOLID.trackDebug(`Mounting new instance element`)
    const node = getOwner()!

    const destroying = element.Destroying.Once(() => {
      SOLID.destroyDebug(`Instance element destroyed, disposing root graph`, element)
      disposeNode(node)
    })

    onCleanup(() => {
      SOLID.cleanupDebug(`Cleaning up instance element`)
      destroying.Disconnect()
      if (!destroyable) return
      SOLID.destroyDebug(`Destroying ${key}`)
      try { element.Destroy() } catch { SOLID.destroyDebug(`Failed to destroy ${key}`) }
    })

    // when in future, props signals changes, will be captured by this effect

    createEffect(() => {
      // tracks mutable objects
      attributes["__track" as keyof typeof attributes];
      SOLID.trackDebug(`Mounting instance attributes`)

      // number keys are transformed to string, even if no number key is normally possible
      for (const k of Object.keys(attributes)) {
        if (k === "Children") continue

        // ref is a special case, as it is not an attribute but a function, to get the instance
        if (k === "Ref") {
          createEffect(() => {
            SOLID.trackDebug(`Tracking instance element ref`)
            const ref = attributes[k as keyof typeof attributes] as ((selfRef: Instance, ref: Instance) => void)
            if (typeIs(ref, "function")) untrack(() => ref(element, element))
          })
          continue
        }
        // attribute  keys
        const prefix = k.find("^(%a+):")[2] as string | undefined;

        // removing prefix, and re-adding Getter and Setter naming
        let key = prefix ? string.sub(k, prefix.size() + 2) : k
        key = (prefix === "set" ? "Set" : prefix === "get" ? "Get" : "") + key

        createEffect(() => {
          SOLID.trackDebug(`Tracking instance element attribute ${k}`)
          const value = attributes[k as keyof typeof attributes]

          // attribute definition
          if (prefix === undefined) {
            try {
              (element as unknown as Record<string, unknown>)[key] = value
            } catch (e) {
              warn(`[SOLID] Tried to set attribute ${k} to ${value}, but failed: ${e}, on:`, element)
            }
            return
          }

          // These more complex attributes are in the same effect, as normally they are not
          // changed too much, as callbacks and any other function don't change directly

          //getter and setter and function
          if (prefix === "set" || prefix === "get" || prefix === "fn") {
            let elementPropFunction = element[key as keyof typeof element]
            if (typeIs(elementPropFunction, "function")) { // ensure the property is a function (setter or getter)

              // if we pass function as value, so we act as a getter, and we ref the getter
              if (typeIs(value, "function")) {
                value((...args: unknown[]) => (elementPropFunction as (el: typeof element, ...args: unknown[]) => void)?.(element, ...args))

                SOLID.createDebug(`Given ${prefix === "get" ? "getter" : "function"} ${k} to jsx's ref`, element)
                onCleanup(() => {
                  elementPropFunction = undefined
                  SOLID.cleanupDebug(`Disconnected ${prefix === "get" ? "getter" : "function"} ${k} from an instance`)
                })
              }
              // unless, we act as a setter, and we pass given value or properties array spreaded into the function's args
              else {
                ArrayUtils.isArray(value)
                  ? elementPropFunction(element, ...(value as unknown[]))
                  : elementPropFunction(element, value)
                SOLID.createDebug(`Used values in setter ${k} to instance`, element)
              }
            }
          }

          // events
          else if (prefix === "on" || prefix === "once" || prefix === "parallel") {
            let elementPropEvent = element[key as keyof typeof element],
              signal = elementPropEvent as RBXScriptSignal,
              fn: Callback;

            // if element prop is a function that means the signal is got using the value as [...functionParams, callback]
            if (typeIs(elementPropEvent, "function")) {
              fn = (value as defined[]).pop() as Callback
              signal = elementPropEvent(element, ...(value as unknown[]))

              // else we consider the elementProp as a signal and the value as a callback
            } else fn = value as Callback

            let connection: RBXScriptConnection

            const owner = getOwner(), callback = (...args: unknown[]) => owner?.apply(() => fn(element, ...args))
            // register the callback to the signal, using the type event provided by the prefix
            if (prefix === "once") connection = signal.Once((...args: unknown[]) => callback(element, ...args))
            else if (prefix === "parallel") connection = signal.ConnectParallel((...args: unknown[]) => callback(element, ...args))
            else connection = signal.Connect((...args: unknown[]) => callback(element, ...args))

            SOLID.createDebug(`Connected event ${k} to an instance`, element)

            // disconnect the signal when the element or attribute is cleaned up
            // (in case of function change, for example)
            onCleanup(() => {
              connection?.Disconnect();
              (connection as unknown) = undefined;
              (signal as unknown) = undefined;
              (fn as unknown) = undefined;
              SOLID.destroyDebug(`Disconnected event ${k} from an instance`)
            })
          }

          onCleanup(() => SOLID.cleanupDebug(`Cleaned up instance element attribute ${k}`))
        })
      }

      onCleanup(() => SOLID.cleanupDebug(`Cleaned up instance element attributes`))
    });

    /* const mappedChildren =  */(
      children as ((() => JSX.Element) | Exclude<JSX.Element, undefined | void>)[]
    ).map((child) => typeIs(child, "function")
      ? createComputation(child, undefined, false, false)
      : child
    )

    return element!
  })
}