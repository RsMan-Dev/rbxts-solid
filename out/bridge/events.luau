-- Compiled with roblox-ts v3.0.0
local TS = _G[script]
local bridge = TS.import(script, TS.getModule(script, "@rbxts", "bridge").out).default
local onCleanup = TS.import(script, TS.getModule(script, "@rbxts", "signals").out).onCleanup
local RunService = TS.import(script, TS.getModule(script, "@rbxts", "services")).RunService
--[[
	*
	 * # useEvent
	 * useEvent is used to use a bridge event.
	 * You can provide a callback to be called when the event is triggered, or just use it to send data via the event.
	 * Handler will be cleaned up when the Owner context is destroyed.
	 *
	 * To type the data sent by the event, you can use the BridgeEventMap interface, like:
	 * ```ts
	 * declare global {
	 *  interface BridgeEventMap {
	 *    hello: { myData: string };
	 *  }
	 * }
	 * ```
	 * Then you can use the event like this:
	 * ```ts
	 * // Client side
	 * // on Owned context
	 * const [sendMyEvent] = useEvent("hello", (data, player) => {
	 *   print("Server sent data: ", data.myData, " local player: ", player.Name);
	 *   sendMyEvent({ myData: "Hello back" });
	 * })
	 *
	 * // Server side
	 * // on Owned context
	 * const [sendMyEvent, broadcastMyEvent] = useEvent("hello", (data, player) => {
	 *   print("Client sent back data: ", data.myData, " from player: ", player.Name);
	 * })
	 * sendMyEvent({ myData: "Hello from server" }, player);
	 * broadcastMyEvent({ myData: "Hello from server to all" });
	 * ```
	 *
	 * @see {@link bridge.on}
	 * @see {@link bridge.off}
	 * @see {@link bridge.send}
	 * @param event The event to listen to
	 * @param callback The callback to call when the event is triggered
	 * @returns A tuple of two functions, first is for sending the event, second is for broadcasting the event (only on server side)
	 
]]
local useEvent = function(event, callback)
	if callback ~= nil then
		bridge.on(event, callback)
		onCleanup(function()
			return bridge:off(event, callback)
		end)
	end
	return { function(sent, player)
		bridge.send(event, sent, player)
	end, if RunService:IsServer() then function(sent)
		bridge:broadcast(event, sent)
	end else nil }
end
return {
	useEvent = useEvent,
}
