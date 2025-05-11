-- Compiled with roblox-ts v3.0.0
local TS = _G[script]
local bridge = TS.import(script, TS.getModule(script, "@rbxts", "bridge").out).default
local Object = TS.import(script, TS.getModule(script, "@rbxts", "jsnatives").out).Object
local _signals = TS.import(script, TS.getModule(script, "@rbxts", "signals").out)
local createEffect = _signals.createEffect
local createRoot = _signals.createRoot
local on = _signals.on
local createMutable = _signals.createMutable
local withoutWrap = _signals.withoutWrap
local RunService = TS.import(script, TS.getModule(script, "@rbxts", "services")).RunService
local DELETE = {}
local function makePatch(current, newData, patchObject)
	if patchObject == nil then
		patchObject = {}
	end
	return Object.diff(Object.excludeTypes(newData, { "function", "thread", "userdata", "buffer" }, true), current, true)
end
local function applyPatch(target, patch)
	return Object.patch(target, patch, true)
end
--[[
	*
	 * # createSynced
	 * createSynced is a function that creates a synced mutable constructor.
	 * Each modifications of the mutable will cause a patch.
	 * Each patch on other side will cause a update of the mutable.
	 * Because data is mutable, it can be edited directly, but:
	 * **if multiple updates are needed at the same time, please use batch, to avoid generating multiple patches**.
	 *
	 * Used as a wrapper to {@link bridge.sync} to create a synced mutable between server and client.
	 *
	 * Usage:
	 * ```ts
	 * // shared/usePlayerData.ts
	 * // Writeable on both server and client, sync init, non throttled
	 * export const usePlayerData = createSynced("playerData", { money: 0, level: 0 });
	 *
	 * // server/PlayerData.ts
	 * // on Owned context
	 * const playerData = usePlayerData(player);
	 * setTimeout(() => playerData().money += 1, 1000);
	 * createEffect(() => {
	 *   print("Level: " + playerData().level); // will print every 100s level + 1
	 * })
	 *
	 * // client/PlayerData.ts
	 * // on Owned context
	 * const playerData = usePlayerData();
	 * createEffect(() => {
	 *   const money = playerData().money;
	 *   print(`Money: ${money}`); // will print every second money + 1
	 *   if(money > 100) {
	 *     batch(() => {
	 *       playerData().money = 0;
	 *       playerData().level += 1;
	 *     });
	 *   }
	 * })
	 * ```
	 *
	 * @see {@link bridge.sync}
	 * @param useKey The key to use for the sync, must be unique
	 * @param init The initial value to use for the sync
	 * @param writeableOn If the sync is writeable on server, client or both, default to "client-server"
	 * @param asyncInit If the sync is initialized asynchronously or not, default to false
	 * @param throttleDelay The delay to use for the sync, default to undefined
	 * @returns A getter to the mutable data
	 
]]
local syncs = {}
local function createSynced(useKey, init, writeableOn, throttleDelay)
	if writeableOn == nil then
		writeableOn = "client-server"
	end
	local _useKey = useKey
	if syncs[_useKey] ~= nil then
		local _useKey_1 = useKey
		return syncs[_useKey_1]
	end
	local constructor = bridge.sync(useKey, init, writeableOn, true, throttleDelay)
	local constructeds = {}
	local mutableConstructor = function(player)
		local synced = constructor(player)
		local mut = createMutable({
			data = Object.dup(synced.data, true),
		})
		local _player = synced.player
		if constructeds[_player] ~= nil then
			local _player_1 = synced.player
			return constructeds[_player_1]
		end
		local patchingMutable = false
		synced.onUpdated(function(ctx)
			patchingMutable = true
			mut.data = Object.dup(ctx.data, true)
			patchingMutable = false
		end)
		createRoot(function()
			createEffect(on(function()
				return makePatch({
					data = synced.data,
				}, withoutWrap(mut, false))
			end, function(patch)
				if patchingMutable then
					return nil
				end
				synced.patch(function(data)
					return applyPatch({
						data = data,
					}, patch).data
				end)
			end, {
				defer = true,
			}))
		end)
		return function()
			return mut.data
		end
	end
	local _useKey_1 = useKey
	syncs[_useKey_1] = mutableConstructor
	return mutableConstructor
end
local globalDatas = {}
local function createGlobalSynced(useKey, init)
	local _useKey = useKey
	if globalDatas[_useKey] ~= nil then
		local _useKey_1 = useKey
		return globalDatas[_useKey_1]
	end
	local constructed = nil
	local key = `server_data:{useKey}`
	local constructor = function()
		if constructed ~= nil then
			return constructed
		end
		local mut = createMutable({
			data = init,
		})
		if RunService:IsServer() then
			createRoot(function()
				createEffect(function()
					return bridge:broadcast(key, withoutWrap(mut, false).data)
				end)
			end)
			bridge.on(key, function(_, player)
				if player == nil then
					return nil
				end
				bridge.send(key, withoutWrap(mut, false).data, player)
			end)
		else
			bridge.on(key, function(data, _)
				mut.data = data
				return mut.data
			end)
			bridge.send(key, nil, nil, true)
		end
		return function()
			return mut.data
		end
	end
	local _useKey_1 = useKey
	globalDatas[_useKey_1] = constructor
	return constructor
end
return {
	createSynced = createSynced,
	createGlobalSynced = createGlobalSynced,
}
