import { BaseComponent } from "@flamework/components";
import { OnInit, OnStart, OnTick, OnPhysics, OnRender } from "@flamework/core";
import { ComputationNode, disposeNode, getCandidateNode, runWithOwner } from "@rbxts/signals";
import { InstanceContext } from "../natives/createInstance";

interface IReactiveBase {
  owner: ComputationNode;
}


/**
 * Populate a computation node owner to the Reactive base, to be able to use it in
 * Lifecycle functions, populated by utils functions next.
 * @param el - The element to populate with the owner
 * @returns 
 */
function populateReactiveBaseRoot<T extends IReactiveBase & (BaseComponent | {})>(el: T) {
  if (el.owner !== undefined) return el;

  // if the owner is a BaseComponent, he has an instance who potentially has an owner
  // we find it, if not instance, we use the candidate node
  el.owner = getCandidateNode()

  // If container is a BaseComponent, we need to dispose the owner when the container is destroyed
  // so we populate the destroy function of the container with a function that disposes the owner
  if (!("destroy" in el)) return el;
  const oldDestroy = (el as unknown as { destroy?: (self: unknown) => void }).destroy;
  (el as unknown as { destroy?: () => void }).destroy = () => {
    disposeNode(el.owner!);
    oldDestroy?.(el);
  };
  return el;
}

type SelfFn<T, P extends unknown[] = []> = (self: T, ...args: P) => void | (() => void);
type SelfFnCtn<K extends string, P extends unknown[] = []> = { [key in K]: (...args: P) => void | (() => void) };;

function populateReactiveRootLifecycles<T extends IReactiveBase & (OnInit | OnStart | OnTick | OnPhysics | OnRender | {})>(el: T) {
  if ("onInit" in el) {
    const oldOnInit = el.onInit as unknown as SelfFn<T>;
    (el as SelfFnCtn<"onInit">).onInit = (...args) => runWithOwner(el.owner!, () => oldOnInit(el, ...args));
  }
  if ("onStart" in el) {
    const oldOnStart = el.onStart as unknown as SelfFn<T>;
    (el as SelfFnCtn<"onStart">).onStart = (...args) => runWithOwner(el.owner!, () => oldOnStart(el, ...args));
  }
  if ("onTick" in el) {
    const oldOnTick = el.onTick as unknown as SelfFn<T, [number]>;
    (el as SelfFnCtn<"onTick", [number]>).onTick = (...args) => runWithOwner(el.owner!, () => oldOnTick(el, ...args));
  }
  if ("onPhysics" in el) {
    const oldOnPhysics = el.onPhysics as unknown as SelfFn<T, [number, number]>;
    (el as SelfFnCtn<"onPhysics", [number, number]>).onPhysics = (...args) => runWithOwner(el.owner!, () => oldOnPhysics(el, ...args));
  }
  if ("onRender" in el) {
    const oldOnRender = el.onRender as unknown as SelfFn<T, [number]>;
    (el as SelfFnCtn<"onRender", [number]>).onRender = (...args) => runWithOwner(el.owner!, () => oldOnRender(el, ...args));
  }
  return el;
}

/**
 * # ReactiveBase
 * ReactiveBase is a base class that wraps an owner in lifecycle functions, to help using SOLID in Flamework.
 * 
 * @example
 * ```ts
 * class MyComponent extends ReactiveBase implements OnStart {
 * 
 *  onStart() {
 *    return <>
 *      ...
 *    </>
 *  }
 * }
 * ```
 */
export abstract class ReactiveBase implements IReactiveBase {
  owner!: ComputationNode;
  constructor() {
    populateReactiveBaseRoot(this);
    populateReactiveRootLifecycles(this);
  }
}

/**
 * # ReactiveComponent
 * ReactiveComponent is a base class that wraps an owner in lifecycle functions, to help using SOLID in Flamework.
 * 
 * @example
 * ```ts
 * class MyComponent extends ReactiveComponent<{}, Frame> implements OnStart {
 * 
 *  onStart() {
 *    return <>
 *      ...
 *    </>
 *  }
 * }
 */
export abstract class ReactiveComponent<T = {}, I extends Instance = Instance> extends BaseComponent<T, I> implements IReactiveBase {
  owner!: ComputationNode;
  constructor() {
    super();
    this.owner.apply(() => InstanceContext.populate(this.instance));
    populateReactiveBaseRoot(this);
    populateReactiveRootLifecycles(this);
  }
}