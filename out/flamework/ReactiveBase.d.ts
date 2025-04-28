import { BaseComponent } from "@flamework/components";
import { ComputationNode } from "@rbxts/signals";
interface IReactiveBase {
    owner: ComputationNode;
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
export declare abstract class ReactiveBase implements IReactiveBase {
    owner: ComputationNode;
    constructor();
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
export declare abstract class ReactiveComponent<T = {}, I extends Instance = Instance> extends BaseComponent<T, I> implements IReactiveBase {
    owner: ComputationNode;
    constructor();
}
export {};
