import { createContext } from "@rbxts/signals";
import type { SOLIDTYPE } from "../rendering";
type SignalFunction<T, A extends any[] = any[], Cb extends Callback = Callback> = {
    (this: T, ...args: A): RBXScriptSignal<Cb>;
};
type SignalAttribute<Cb extends Callback = Callback> = RBXScriptSignal<Cb>;
type GetterKey<T extends string> = `Get${T}`;
type SetterKey<T extends string> = `Set${T}`;
type InstanceOtherAttributes<T> = {
    [key in keyof T as T[key] extends (...args: any[]) => any ? never : T[key] extends SignalAttribute ? never : key]: T[key];
};
type InstanceFunctions<T> = {
    [key in keyof T as T[key] extends (...args: any[]) => any ? T[key] extends SignalFunction<T> ? never : key extends GetterKey<infer N> ? `get:${N}` : key extends SetterKey<infer N> ? `set:${N}` : key extends string ? `fn:${key}` : never : never]: T[key] extends (...args: infer A) => infer R ? ((method: (...args: A) => R) => void) | (A extends [
        infer A1
    ] ? A1 extends [
    ] ? A | Readonly<A> : A1 : A | Readonly<A>) : never;
};
type EventPrefixes<T> = T extends string ? `on:${T}` | `once:${T}` | `parallel:${T}` : never;
type EventCallback<T, Cb extends Callback> = Cb extends (...args: infer A) => infer R ? (inst: T, ...args: A) => R : never;
type InstanceEvents<T> = {
    [key in keyof T as T[key] extends SignalAttribute ? EventPrefixes<key> : T[key] extends SignalFunction<T> ? EventPrefixes<key> : never]: T[key] extends SignalFunction<T, infer A, infer R> ? key extends "GetPropertyChangedSignal" ? [
        Exclude<ExcludeKeys<T, symbol | Callback | RBXScriptSignal<Callback>>, "Changed">,
        EventCallback<T, R>
    ] : [
        ...A,
        EventCallback<T, R>
    ] : T[key] extends SignalAttribute<infer Cb> ? EventCallback<T, Cb> : never;
};
export type TransformedInstanceAttributes<T extends InstanceMap[keyof InstanceMap]> = {
    Children?: JSX.Element;
    Ref?: (ref: T) => void | T;
} & Partial<InstanceOtherAttributes<T> & InstanceEvents<T> & InstanceFunctions<T>>;
export declare const InstanceContext: ReturnType<typeof createContext<Instance | undefined>>;
export declare function runWithInstance<R, T extends Instance | undefined>(instance: T, callback: () => R): R;
export declare function getInstance<T extends Instance | undefined>(): T;
export declare function ProvideInstance(props: {
    Children: () => JSX.Element;
    Value: Instance;
}): () => JSX.Element;
export default function createInstance(SOLID: SOLIDTYPE, key: unknown, attributes: Record<string, unknown>, ...children: ((() => JSX.Element) | JSX.Element)[]): Instance | undefined;
export {};
