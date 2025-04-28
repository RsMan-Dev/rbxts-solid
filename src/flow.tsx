import SOLID from "./rendering";
import { createMemo, createRoot, createSignal, on, onCleanup, Signal } from "@rbxts/signals";
import { Object } from "@rbxts/jsnatives";

type FastForItems = unknown[] | Record<string, unknown>
type FastForItem<T extends FastForItems> = T extends (infer U)[] ? U : T extends Record<any, infer U2> ? U2 : never;
type FastForKey<T extends FastForItems> = T extends any[] ? number : T extends Record<infer K, any> ? K : never;
type FastForMemos<Arr extends FastForItems> = Map<FastForItem<Arr>, [JSX.Element, Signal<FastForKey<Arr>>, () => void]>;

function valFromKey<Arr extends FastForItems>(arrRaw: Arr, i: FastForKey<Arr>): FastForItem<Arr> {
  const v = arrRaw[i as keyof typeof arrRaw] as FastForItem<Arr>;
  // TODO: add mutable when implemented
  // if (!hasProxy(arrRaw)) return v;     // if not proxy array, return the value directly
  // if (hasProxy(v)) return v;           // if proxy is initialized, return it
  // untrack(() => withProxy(arrRaw)[i]); // to trigger the proxy creation
  return v;                               // that should have the proxy now
}

/**
 * # FastFor
 * FastFor is a for loop that avoid some heavy checks and is faster than the regular For component by not allowing
 * duplicates and avoiding complex array mapping. For many caes, it's useless to be faster, but for rare case, it's a
 * good optimization, for data that never gets duplicates, it's a free performance upgrade.
 * It uses ways to ignore proxies and other Solid-js related stuff to be faster.
 * @warn this For doesn't allow duplicates, if you have duplicates, only the first iteration of it will be kept.
 */
export function FastFor<Arr extends FastForItems>(props: {
  Each: Arr | undefined | null,
  Fallback?: JSX.Element,
  Children: (item: FastForItem<Arr>, index: () => FastForKey<Arr>) => JSX.Element,
}) {
  const memos = createMemo<FastForMemos<Arr>>((curr) => {
    const newMap: typeof curr = new Map(),
      entries = [] as [FastForItem<Arr>, FastForKey<Arr>][],
      // each = withoutProxy(props.each ?? [] as any as Arr, true);
      each = props.Each ?? [] as any as Arr;

    for (const k of Object.keys(each)) {
      entries.push([valFromKey(each, k as FastForKey<Arr>), k as FastForKey<Arr>]);
    }

    for (const [v, i] of entries) {
      if (newMap.has(v)) continue;
      const currV = curr!.get(v)
      if (currV) curr!.delete(v) && (currV[1]((typeIs(i, "number") ? i - 1 : i) as any) || true) && newMap.set(v, currV)
      else {
        let disp: () => void, s = createSignal((typeIs(i, "number") ? i - 1 : i) as FastForKey<Arr>);
        newMap.set(v, [
          createRoot(d => {
            disp = d;
            return props.Children(/*withProxy*/(v), () => s())
          }),
          s,
          disp!
        ])
      }
    }

    for (const [_, [__, ___, disp]] of curr!) disp()

    return newMap;
  }, new Map());


  function memoizedElements() {
    const elements = [] as (JSX.Element & defined)[]
    for (const [_, [v]] of memos()) {
      elements.push(v as JSX.Element & defined)
    }
    return elements
  }

  onCleanup(() => memos().forEach(([_, __, disp]) => disp()))

  // TODO: fallback act wrongly, props seems to be glitched
  return <>{
    memos().size() === 0 ? props.Fallback : memoizedElements()
  }</>
}




export function Show(props: { When: boolean, Children: JSX.Element, Fallback?: JSX.Element }) {
  return createMemo(on(createMemo(() => !!props.When).accessor, (when) => {
    if (when) return props.Children
    return props.Fallback
  }))()
}