import { ArrayUtils, Object, Proxy } from "@rbxts/jsnatives"
import { createMemo, getOwner, untrack } from "@rbxts/signals"
import createInstance from "./natives/createInstance"
import { TransformedInstanceAttributes } from "./natives/createInstance"

declare global {
  type InstanceMap = CreatableInstances & { Instance: Instance }
  namespace JSX {
    type IntrinsicElements = {
      [instanceKey in keyof InstanceMap as `inst${instanceKey}`]: TransformedInstanceAttributes<InstanceMap[instanceKey]>;
    }
    interface ElementChildrenAttribute {
      Children: {}; // specify children name to use
    }

    type Element = Instance | undefined | void | ArrayElement | boolean | string | ((...any: any[]) => unknown)
    interface ArrayElement extends Array<Element> { }
  }
}

type MergeableElement = Record<string, unknown> | Record<string, () => unknown>
type Mergeable = (() => MergeableElement) | MergeableElement
type ReturnIfFunction<T> = T extends (...args: any[]) => infer R ? R : T;
type Union<T, U> = { [K in keyof T]: T[K] } & {
  [K in keyof U as K extends keyof T ? never : K]: ReturnIfFunction<U[K]>;
}
type MergeArray<T extends unknown[] = []> = T extends [infer F, ...infer R] ? Union<ReturnIfFunction<F>, MergeArray<R>> : T extends [] ? {} : never;

const MERGED = {} as unknown as symbol, trueFn = () => true

// Interface who contains all utilities for jsx
const SOLID = {
  debug: false,
  debugged: new Set<"cleanup" | "track" | "create" | "destroy">(["cleanup", "track", "create", "destroy"]),

  canDebug(dbgType: "cleanup" | "track" | "create" | "destroy") { return this.debug === true && this.debugged.has(dbgType) },
  destroyDebug(...elements: unknown[]) { this.canDebug("destroy") && this.debugMessage("[DESTROY]", ...elements) },
  createDebug(...elements: unknown[]) { this.canDebug("create") && this.debugMessage("[CREATE]", ...elements) },
  trackDebug(...elements: unknown[]) { this.canDebug("track") && this.debugMessage("[TRACK]", ...elements) },
  cleanupDebug(...elements: unknown[]) { this.canDebug("cleanup") && this.debugMessage("[CLEANUP]", ...elements) },
  debugMessage(...elements: unknown[]) { this.debug && print("[SOLID-DEBUG]", ...elements) },

  createElement: (
    key: unknown,
    attributes: Record<string, unknown>,
    ...children: ((() => JSX.Element) | JSX.Element)[]
  ): JSX.Element => {
    if (!getOwner()) throw "No element will be created, no owner found"
    else SOLID.trackDebug(`Owned element creation`, key)

    // for functional component context
    if (typeIs(key, "function")) {
      SOLID.createDebug(`Creating functional component`)
      return untrack(() => (key as ((...a: unknown[]) => JSX.Element))(
        SOLID.mergeProps(
          !attributes[MERGED as unknown as string] ? () => attributes : attributes,
          {
            Children: () => {
              const memoizedChildren = (
                children as ((() => JSX.Element) | Exclude<JSX.Element, undefined | void>)[]
              ).map((child) => typeIs(child, "function") ? createMemo(child).accessor : child)
              if (memoizedChildren.size() === 0) return undefined
              else if (memoizedChildren.size() === 1) return typeIs(memoizedChildren[0], "function") ? memoizedChildren[0]() : memoizedChildren[0]
              else return memoizedChildren.map((child) => typeIs(child, "function") ? child() : child)
            },
          }
        )
      ))
    }

    return createInstance(SOLID, key, attributes, ...children)
  },

  createFragment: (
    ...children: ((() => JSX.Element) | JSX.Element)[]
  ) => {
    if (!getOwner()) throw "No element will be created, no owner found"
    return createMemo(() => (
      children as ((() => JSX.Element) | Exclude<JSX.Element, undefined | void>)[]
    ).map((child) => typeIs(child, "function") ? child() : child))()
  },

  mergeProps: <T extends Mergeable[]>(...sources: T): MergeArray<T> => {
    const target: Record<string, unknown> = {}, size = sources.size()

    for (const i of $range(0, size)) {
      const s = sources[i];
      sources[i] = typeIs(s, "function") ? createMemo(s as () => Record<string, unknown>).accessor : s;
    }

    let get: (target: Record<string, unknown>, key: unknown) => unknown,
      ownKeys: (target: Record<string, unknown>) => string[]

    // if size is 1, unwrap the array and create simplified functions
    if (size === 1) {
      const source = sources[0]
      if (Object.isCallable(source)) {
        get = (_, key) => (source as () => Record<string, unknown>)()[key as string]
        ownKeys = () => Object.keys(source())
      } else if ((source as Record<symbol, boolean>)[MERGED]) {
        get = (_, key) => (source as Record<string, unknown>)[key as string]
        ownKeys = () => Object.keys(source)
      } else {
        get = (_, key) => {
          const s = (source as Record<string, unknown>)[key as string]
          if (Object.isCallable(s)) return s()
          return s
        }
        ownKeys = () => {
          return Object.keys(source)
        }
      }
    } else {
      get = (_, key) => {
        let found = false
        for (const i of $range(0, size)) {
          let source = sources[i] as unknown
          if (source === undefined) continue

          if (Object.isCallable(source)) {
            source = (source as () => Record<string, unknown>)()[key as string]
            found = source !== undefined
          } else {
            const merged = (source as Record<symbol, boolean>)[MERGED]
            source = (source as Record<string, unknown>)[key as string]
            found = source !== undefined
            if (!merged && Object.isCallable(source)) source = source()
          }
          if (found) return source
        }
      }
      ownKeys = () => {
        const keys = new Set<string>()
        for (const source of sources) {
          const el = Object.isCallable(source) ? source() : source as Record<string, unknown>
          for (const key of Object.keys(el)) keys.add(key)
        }
        return [...keys]
      }
    }

    return new Proxy(target, { get, ownKeys, set: trueFn }, { [MERGED]: true }) as unknown as MergeArray<T>
  },

  pickProps: <T extends Record<string, unknown>, K extends keyof T>(
    props: T,
    picked: K[]
  ): Pick<T, K> => {
    const target: Record<string, unknown> = {}, pickedSet = new Set(picked)

    return new Proxy(
      target,
      {
        get: (_, prop) => {
          if (pickedSet.has(prop as K)) return props[prop as keyof T];
        },
        set: (_, prop, value) => {
          if (pickedSet.has(prop as K)) (props as Record<string, unknown>)[prop as string] = value;
          return true;
        },
        ownKeys: () => {
          const keys = new Set<string>()
          for (const key of Object.keys(props)) {
            if (pickedSet.has(key as unknown as K)) keys.add(key as string)
          }
          return [...keys]
        }
      }
    ) as unknown as Pick<T, K>;
  },

  omitProps: <T extends Record<string, unknown>, K extends keyof T>(
    props: T,
    omited: K[]
  ): Omit<T, K> => {
    const target: Record<string, boolean> = {}, omitedSet = new Set(omited)

    return new Proxy(
      target,
      {
        get: (_, prop) => {
          if (!omitedSet.has(prop as K)) return props[prop as keyof T];
        },
        set: (_, prop, value) => {
          if (!omitedSet.has(prop as K)) (props as Record<string, unknown>)[prop as string] = value;
          return true;
        },
        ownKeys: () => {
          const keys = new Set<string>()
          for (const key of Object.keys(props)) {
            if (!omitedSet.has(key as unknown as K)) keys.add(key as string)
          }
          return [...keys]
        }
      }
    ) as unknown as Omit<T, K>;
  },

  splitProps: <T extends Record<string, unknown>, K extends keyof T>(
    props: T,
    keys: K[]
  ): [Pick<T, K>, Omit<T, K>] => {
    return [
      SOLID.pickProps(props, keys),
      SOLID.omitProps(props, keys)
    ]
  },

  unwrapChildren: <T extends unknown[]>(children: T): T => {
    if (typeIs(children, "function")) children = children() as T
    if (ArrayUtils.isArray(children)) return (children as defined[]).map((child) => {
      if (typeIs(child, "function")) child = child() as defined
      if (ArrayUtils.isArray(child)) return SOLID.unwrapChildren(child)
      return child
    }) as T
    return children as T
  }
}

export type SOLIDTYPE = typeof SOLID

export const { mergeProps, pickProps, omitProps, splitProps, unwrapChildren } = SOLID

export default SOLID;