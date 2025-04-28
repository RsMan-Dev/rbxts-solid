import bridge, { FunctionCallback } from "@rbxts/bridge";
import { onCleanup } from "@rbxts/signals";

type FunctionCallers<T extends string | keyof BridgeFunctionMap> = {
  async: T extends keyof BridgeFunctionMap
  ? (data: BridgeFunctionMap[T][0], player?: Player) => Promise<BridgeFunctionMap[T][1]>
  : (data: unknown, player?: Player) => Promise<unknown>,
  call: T extends keyof BridgeFunctionMap
  ? (data: BridgeFunctionMap[T][0], player?: Player) => BridgeFunctionMap[T][1]
  : (data: unknown, player?: Player) => unknown
}


/**
 * # useFunction
 * useFunction is used to use a bridge function.  
 * You can provide a callback to be called when the function is called remotely, or just use it to execute remote function(s).
 * If owner gets destroyed, the function will be cleaned up. and will be able to be registered again.
 * **Note: A function can only be registered once on every scope (server or client), make sure, the hook is used only once in a scope.**
 * 
 * To type the data sent by the function, you can use the BridgeFunctionMap interface, like:
 * ```ts
 * declare global {
 *  interface BridgeFunctionMap {
 *    hello: BridgeFunction<{ myData: string }, { myResult: number }>;
 *  }
 * }
 * ```
 * Then you can use the function like this:
 * ```ts
 * // Client side
 * // on Owned context
 * const { async: callMyFunction } = useFunction("hello", (data, player) => {
 *   print("Server sent data: ", data.myData, " local player: ", player.Name);
 *   return { myResult: 42 };
 * });
 * callMyFunction({ myData: "Hello from client" }).then((result) => {
 *   // send 42, as server function returns client function's result
 *   print("Server sent back data: ", result.myResult); 
 * });
 * 
 * // Server side
 * // on Owned context
 * const { call: callMyFunction } = useFunction("hello", (data, player) => {
 *   print("Client sent data: ", data.myData, " from player: ", player.Name);
 *   return callMyFunction({ myData: "Hello from server" }, player);
 * });
 * ```
 * @see {@link bridge.fn}
 * @see {@link bridge.fnOff}
 * @see {@link bridge.call}
 * @param name The name of the function to register.
 * @param callback The callback to call when the function is called remotely.
 * @returns object with two functions `async` and `call`, which can be used to call the function remotely respectively asynchronously or synchronously.
 */
export const useFunction: {
  <T extends keyof BridgeFunctionMap>(name: T, callback?: FunctionCallback<BridgeFunctionMap[T][0], BridgeFunctionMap[T][1]>): FunctionCallers<T>,
  <T extends string>(name: T, callback?: FunctionCallback): FunctionCallers<T>,
} = (name: string, callback?: FunctionCallback) => {
  if (callback !== undefined) {
    bridge.fn(name, callback);
    onCleanup(() => bridge.fnOff(name));
  }
  return {
    async: (data: unknown, player?: Player) => bridge.callAsync(name, data, player),
    call: (data: unknown, player?: Player) => bridge.call(name, data, player)
  }
}