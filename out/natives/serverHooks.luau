-- Compiled with roblox-ts v3.0.0
local TS = _G[script]
local ProfileStore = TS.import(script, TS.getModule(script, "@rbxts", "profile-store").src)
local Players = TS.import(script, TS.getModule(script, "@rbxts", "services")).Players
local _jsnatives = TS.import(script, TS.getModule(script, "@rbxts", "jsnatives").out)
local clearTimeout = _jsnatives.clearTimeout
local setTimeout = _jsnatives.setTimeout
local _signals = TS.import(script, TS.getModule(script, "@rbxts", "signals").out)
local createEffect = _signals.createEffect
local onCleanup = _signals.onCleanup
local createMutable = _signals.createMutable
local withoutWrap = _signals.withoutWrap
local function useStore(defaults, uniqueKey, player, eraseAtInit)
	if defaults == nil then
		defaults = {}
	end
	if uniqueKey == nil then
		uniqueKey = ""
	end
	if eraseAtInit == nil then
		eraseAtInit = false
	end
	local profileStore = ProfileStore.New("PlayerData", defaults)
	local _result = player
	if _result ~= nil then
		_result = _result.UserId
	end
	local _condition = _result
	if _condition == nil then
		_condition = "server"
	end
	local session = profileStore:StartSessionAsync(`player_{_condition}_{uniqueKey}`, {
		Cancel = function()
			return if player ~= nil then player.Parent ~= Players else false
		end,
	})
	if player ~= nil then
		session:AddUserId(player.UserId)
		session:Reconcile()
	end
	local value = createMutable({
		data = session.Data,
	})
	if eraseAtInit then
		value.data = defaults
	end
	local function save(unwrapped)
		session.Data = unwrapped
		session:Save()
	end
	local currentTimeout
	local currentSavingValue
	local function createSave(value)
		currentSavingValue = value
		if currentTimeout ~= 0 and currentTimeout == currentTimeout and currentTimeout ~= "" and currentTimeout then
			return nil
		end
		currentTimeout = setTimeout(function()
			if currentSavingValue ~= nil then
				save(currentSavingValue)
			end
			currentTimeout = nil
			currentSavingValue = nil
		end, 1000)
	end
	onCleanup(function()
		currentTimeout = clearTimeout(currentTimeout)
		save(withoutWrap(value.data, false))
	end)
	createEffect(function()
		return createSave(withoutWrap(value.data, false))
	end)
	return function()
		return value.data
	end
end
return {
	useStore = useStore,
}
