import { batch, createSignal, onCleanup, Signal } from "@rbxts/signals";
import { getInstance } from "./createInstance";
import { clearInterval, clearTimeout, Object, Proxy, setInterval, setTimeout } from "@rbxts/jsnatives";

export function useInstanceAttributes<T extends Record<string, AttributeValue | undefined>>() {
  const instance = getInstance()
  if (!instance) return undefined
  const rootSignal = createSignal(undefined, { eq: false });
  const attributes = {} as Record<string, Signal<AttributeValue | undefined>>;

  function setAttribute(attribute: string, value: AttributeValue | undefined) {
    if (!(attribute in attributes)) {
      batch(() => {
        attributes[attribute] = createSignal(value);
        rootSignal(undefined); // Trigger reactivity for every tracking of attribute that is not already set
      })
    } else attributes[attribute]!(value);
  }

  function getAttribute(attribute: string) {
    return attribute in attributes ? attributes[attribute]!() : rootSignal();
  }

  instance.GetAttributes().forEach((value, attribute) => setAttribute(attribute, value));

  const changed = instance.AttributeChanged.Connect((attribute: string) => {
    const value = instance.GetAttribute(attribute);
    setAttribute(attribute, value);
  })

  onCleanup(() => {
    changed.Disconnect();
  })

  return new Proxy({} as Record<string, unknown>, {
    get: (_, prop) => getAttribute(prop as string),
    set: (_, prop, value) => {
      instance.SetAttribute(prop as string, value as AttributeValue);
      setAttribute(prop as string, value as AttributeValue);
      return true;
    },
    ownKeys: () => {
      return Object.keys(attributes);
    }
  }) as unknown as T;
}

export function createInterval(callback: () => void, interval: number) {
  const intervalId = setInterval(callback, interval);
  onCleanup(() => clearInterval(intervalId));
}

export function createTimeout(callback: () => void, timeout: number) {
  const timeoutId = setTimeout(callback, timeout);
  onCleanup(() => clearTimeout(timeoutId));
}
