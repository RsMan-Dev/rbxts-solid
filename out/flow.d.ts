type FastForItems = unknown[] | Record<string, unknown>;
type FastForItem<T extends FastForItems> = T extends (infer U)[] ? U : T extends Record<any, infer U2> ? U2 : never;
type FastForKey<T extends FastForItems> = T extends any[] ? number : T extends Record<infer K, any> ? K : never;
/**
 * # FastFor
 * FastFor is a for loop that avoid some heavy checks and is faster than the regular For component by not allowing
 * duplicates and avoiding complex array mapping. For many caes, it's useless to be faster, but for rare case, it's a
 * good optimization, for data that never gets duplicates, it's a free performance upgrade.
 * It uses ways to ignore proxies and other Solid-js related stuff to be faster.
 * @warn this For doesn't allow duplicates, if you have duplicates, only the first iteration of it will be kept.
 */
export declare function FastFor<Arr extends FastForItems>(props: {
    Each: Arr | undefined | null;
    Fallback?: JSX.Element;
    Children: (item: FastForItem<Arr>, index: () => FastForKey<Arr>) => JSX.Element;
}): JSX.Element;
export declare function Show(props: {
    When: boolean;
    Children: JSX.Element;
    Fallback?: JSX.Element;
}): JSX.Element;
export {};
