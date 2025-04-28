import { TransformedInstanceAttributes } from "./createInstance";
type RefProps<T extends Instance> = {
    Element: T | undefined;
} & TransformedInstanceAttributes<T>;
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
export declare function Ref<T extends Instance>(props: RefProps<T>): Instance | undefined;
/**
 * Same as {@link Ref}, but the element will be cloned, without altering the original element.
 * The cloned element will be moved to the parent of the Ref component, then on dispose,
 * it will be destroyed.
 * @param props The props to pass to the Ref component
 * @returns Element
 */
export declare function Cloned<T extends Instance>(props: RefProps<T>): JSX.Element;
/**
 * Find an element from a parent and a path
 * @param parent The parent instance to search from
 * @param path The path to the element, relative to the parent
 * @returns The element found freezes if not found, as it waits for it to be created
 */
export declare function findElFromParentAndPath<T extends Instance>(parent?: Instance, path?: string): T | undefined;
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
export declare function RefPath<T extends Instance>(props: Omit<RefProps<T>, "Element"> & {
    Path?: string;
}): JSX.Element;
/**
 * Same actions as {@link RefPath} and {@link Cloned} combined
 * @param props The props to pass to the Ref component
 * @returns
 */
export declare function ClonedPath<T extends Instance>(props: Omit<RefProps<T>, "Element"> & {
    Path?: string;
}): JSX.Element;
export declare function RefPredicate<T extends Instance>(props: Omit<RefProps<T>, "Element"> & {
    Tag?: string;
    Predicate?: (el: Instance) => boolean;
    TrackAttributes?: boolean;
}): undefined;
export {};
