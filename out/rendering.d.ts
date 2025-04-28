import { TransformedInstanceAttributes } from "./natives/createInstance";
declare global {
    type InstanceMap = CreatableInstances & {
        Instance: Instance;
    };
    namespace JSX {
        type IntrinsicElements = {
            [instanceKey in keyof InstanceMap as `inst${instanceKey}`]: TransformedInstanceAttributes<InstanceMap[instanceKey]>;
        };
        interface ElementChildrenAttribute {
            Children: {};
        }
        type Element = Instance | undefined | void | ArrayElement | boolean | string | ((...any: any[]) => unknown);
        interface ArrayElement extends Array<Element> {
        }
    }
}
type MergeableElement = Record<string, unknown> | Record<string, () => unknown>;
type Mergeable = (() => MergeableElement) | MergeableElement;
type ReturnIfFunction<T> = T extends (...args: any[]) => infer R ? R : T;
type Union<T, U> = {
    [K in keyof T]: T[K];
} & {
    [K in keyof U as K extends keyof T ? never : K]: ReturnIfFunction<U[K]>;
};
type MergeArray<T extends unknown[] = [
]> = T extends [
    infer F,
    ...infer R
] ? Union<ReturnIfFunction<F>, MergeArray<R>> : T extends [
] ? {} : never;
declare const SOLID: {
    debug: boolean;
    debugged: Set<"cleanup" | "track" | "create" | "destroy">;
    canDebug(dbgType: "cleanup" | "track" | "create" | "destroy"): boolean;
    destroyDebug(...elements: unknown[]): void;
    createDebug(...elements: unknown[]): void;
    trackDebug(...elements: unknown[]): void;
    cleanupDebug(...elements: unknown[]): void;
    debugMessage(...elements: unknown[]): void;
    createElement: (key: unknown, attributes: Record<string, unknown>, ...children: ((() => JSX.Element) | JSX.Element)[]) => JSX.Element;
    createFragment: (...children: ((() => JSX.Element) | JSX.Element)[]) => unknown[];
    mergeProps: <T extends Mergeable[]>(...sources: T) => MergeArray<T>;
    pickProps: <T extends Record<string, unknown>, K extends keyof T>(props: T, picked: K[]) => Pick<T, K>;
    omitProps: <T extends Record<string, unknown>, K extends keyof T>(props: T, omited: K[]) => Omit<T, K>;
    splitProps: <T extends Record<string, unknown>, K extends keyof T>(props: T, keys: K[]) => [Pick<T, K>, Omit<T, K>];
    unwrapChildren: <T extends unknown[]>(children: T) => T;
};
export type SOLIDTYPE = typeof SOLID;
export declare const mergeProps: <T extends Mergeable[]>(...sources: T) => MergeArray<T>, pickProps: <T extends Record<string, unknown>, K extends keyof T>(props: T, picked: K[]) => Pick<T, K>, omitProps: <T extends Record<string, unknown>, K extends keyof T>(props: T, omited: K[]) => Omit<T, K>, splitProps: <T extends Record<string, unknown>, K extends keyof T>(props: T, keys: K[]) => [Pick<T, K>, Omit<T, K>], unwrapChildren: <T extends unknown[]>(children: T) => T;
export default SOLID;
