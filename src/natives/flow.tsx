import SOLID, { omitProps } from "../rendering";
import { createMemo, onCleanup, createSignal, createEffect, batch, getOwner, createComputation, disposeNode } from "@rbxts/signals";
import createInstance, { getInstance, InstanceContext, TransformedInstanceAttributes } from "./createInstance";

type RefProps<T extends Instance> = {
  Element: T | undefined,
} & TransformedInstanceAttributes<T>


/**
 * Ref component to manipulate an element in jsx context, using basic jsx props, 
 * as it was created by jsx. It will not be destroyed when the parent is destroyed, 
 * ref will be disposed with its children when the parent is destroyed.
 * The target element will be moved to the parent of the Ref component, then on dispose, 
 * it will be moved back to its original parent, if it can be.
 * 
 * @warn Only one Ref component can manipulate an element at a time as only one computation node be populated by one unique instance.
 * @param props The props to pass to the Ref component
 * @returns Element
 */
export function Ref<T extends Instance>(props: RefProps<T>) {
  const omited = omitProps(props, ["Element", "Children"])
  return createMemo(() => {
    const el = props.Element
    if (!el) return undefined

    return createInstance(
      SOLID,
      props.Element,
      omited as Record<string, unknown>,
      () => props.Children,
    )
  })()
}


/**
 * Same as {@link Ref}, but the element will be cloned, without altering the original element.
 * The cloned element will be moved to the parent of the Ref component, then on dispose,
 * it will be destroyed.
 * @param props The props to pass to the Ref component
 * @returns Element
 */
export function Cloned<T extends Instance>(props: RefProps<T>) {
  const element = createMemo(() => {
    const el = props.Element
    if (!el) return undefined
    const cloned = el.Clone()
    // if destroyed, will fail, not a problem
    try { cloned.Parent = getInstance() } catch { }
    onCleanup(() => cloned.Destroy())
    return cloned as T
  })

  return <Ref<T>
    {...{ Element: element() } as RefProps<T>}
    {...omitProps(props, ["Element", "Children"]) as {}}
  >
    {props.Children}
  </Ref>
}

/**
 * Find an element from a parent and a path
 * @param parent The parent instance to search from
 * @param path The path to the element, relative to the parent
 * @returns The element found freezes if not found, as it waits for it to be created
 */
export function findElFromParentAndPath<T extends Instance>(parent?: Instance, path?: string) {
  if (!parent || !path) return undefined
  const pathSteps = path.split(".")
  let el: Instance | undefined = parent
  for (const step of pathSteps) {
    if (!el) return undefined
    el = el.WaitForChild(step)
  }
  if (!el) return undefined
  return el as T
}

/**
 * Find an element from a path relative to the parent, and will {@link Ref} it.
 * If moveTargetToIt is true, the target will be moved to the parent of the Ref component.
 * @param parent The parent instance to search from
 * @param path The path to the element, relative to the parent
 * @param moveTargetToIt If true, the target will be moved Ref's current parent
 * @returns The element found, or undefined if not found
 * @example
 * ```tsx
 * <RefPath path="MyFolder.MyPart" mooveParentToIt={true}>
 *   <instPart />
 * </RefPath>
 * ```
 * This will find the part MyPart in the folder MyFolder, and move the parent to it
**/
export function RefPath<T extends Instance>(props: Omit<RefProps<T>, "Element"> & { Path?: string }) {
  const parent = getInstance()
  const element = createSignal(undefined as Instance | undefined)

  createEffect(() => {
    const path = props.Path
    if (!path) element(undefined)
    else (async () => {
      const el = findElFromParentAndPath(parent, path)
      element(el)
    })().then()
  })

  return <Ref<T>
    {...{ Element: element() } as RefProps<T>}
    {...omitProps(props, ["Path", "Children"]) as {}}
  >
    {props.Children}
  </Ref>
}

/**
 * Same actions as {@link RefPath} and {@link Cloned} combined
 * @param props The props to pass to the Ref component
 * @returns 
 */
export function ClonedPath<T extends Instance>(props: Omit<RefProps<T>, "Element"> & { Path?: string }) {
  const parent = getInstance()
  const element = createSignal(undefined as Instance | undefined)

  createEffect(() => {
    const path = props.Path
    if (!path) element(undefined)
    else (async () => {
      const el = findElFromParentAndPath(parent, path)
      batch(() => element(el))
    })().then()
  })

  return <Cloned<T>
    {...{ Element: element() } as RefProps<T>}
    {...omitProps(props, ["Path", "Children"]) as {}}
  >
    {props.Children}
  </Cloned>
}


export function RefPredicate<T extends Instance>(props: Omit<RefProps<T>, "Element"> & {
  Tag?: string,
  Predicate?: (el: Instance) => boolean,
  TrackAttributes?: boolean
}) {
  const parent = getInstance(), owner = getOwner(), omited = omitProps(props, ["Tag", "Predicate", "TrackAttributes", "Children"])
  if (!parent || !owner) return undefined
  const predicate = createMemo(() => {
    const pred = props.Predicate
    const tag = props.Tag

    if (tag === undefined && pred === undefined) return undefined

    return (el: Instance) => {
      let allow = true
      if (tag !== undefined) allow = el.HasTag(tag) && allow
      if (pred !== undefined) allow = pred(el) && allow
      return allow
    }
  })

  const descendantsTracks = new Map<Instance, RBXScriptConnection[]>()
  const children = new Map<Instance, { dispose: () => void }>()

  function removeChild(el: Instance) {
    if (!children.has(el)) return
    const state = children.get(el)
    if (state !== undefined) {
      state.dispose()
      children.delete(el)
    }
  }

  function addChild(el: Instance) {
    if (children.has(el)) return
    const { node } = owner!.apply(() => createComputation(() => {
      InstanceContext.populate(el)
      return createInstance(
        SOLID,
        el,
        omited as Record<string, unknown>,
        () => props.Children ?? [],
      )
    }, undefined, true, false))

    children.set(el, {
      dispose: () => disposeNode(node),
    })
  }

  const addConnection = parent.DescendantAdded.Connect((el) => {
    if (predicate()?.(el) === true) addChild(el)
    if (descendantsTracks.has(el)) return
    const connections = [] as RBXScriptConnection[]
    const changed = (el.Changed as RBXScriptSignal)?.Connect(() => {
      if (!predicate()?.(el)) removeChild(el)
      else addChild(el)
    })
    const attributeChanged = el.AttributeChanged.Connect(() => {
      if (!props.TrackAttributes) return
      if (!predicate()?.(el) === true) removeChild(el)
      else addChild(el)
    })
    if (changed !== undefined) connections.push(changed)
    connections.push(attributeChanged)
  })

  const removeConnection = parent.DescendantRemoving.Connect((el) => {
    removeChild(el)
    const connections = descendantsTracks.get(el)
    if (connections !== undefined) {
      for (const connection of connections) connection.Disconnect()
      descendantsTracks.delete(el)
    }
  })

  onCleanup(() => {
    addConnection.Disconnect()
    removeConnection.Disconnect()
    for (const [el] of children) removeChild(el)
    children.clear()
  })

  createEffect(() => {
    const pred = predicate()
    if (pred === undefined) {
      for (const [el] of children) removeChild(el)
    } else {
      for (const [el] of children) if (pred(el) !== true) removeChild(el)
      for (const el of parent.GetDescendants()) {
        if (!children.has(el) && pred(el) === true) addChild(el)
      }
    }
  })

}