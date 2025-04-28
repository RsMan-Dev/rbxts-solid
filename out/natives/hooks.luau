-- Compiled with roblox-ts v3.0.0
local TS = _G[script]
local _signals = TS.import(script, TS.getModule(script, "@rbxts", "signals").out)
local batch = _signals.batch
local createSignal = _signals.createSignal
local onCleanup = _signals.onCleanup
local getInstance = TS.import(script, script.Parent, "createInstance").getInstance
local _jsnatives = TS.import(script, TS.getModule(script, "@rbxts", "jsnatives").out)
local clearInterval = _jsnatives.clearInterval
local clearTimeout = _jsnatives.clearTimeout
local Object = _jsnatives.Object
local Proxy = _jsnatives.Proxy
local setInterval = _jsnatives.setInterval
local setTimeout = _jsnatives.setTimeout
local function useInstanceAttributes()
	local instance = getInstance()
	if not instance then
		return nil
	end
	local rootSignal = createSignal(nil, {
		eq = false,
	})
	local attributes = {}
	local function setAttribute(attribute, value)
		if not (attributes[attribute] ~= nil) then
			batch(function()
				attributes[attribute] = createSignal(value)
				rootSignal(nil)
			end)
		else
			attributes[attribute](value)
		end
	end
	local function getAttribute(attribute)
		return if attributes[attribute] ~= nil then attributes[attribute]() else rootSignal()
	end
	local _exp = instance:GetAttributes()
	-- ▼ ReadonlyMap.forEach ▼
	local _callback = function(value, attribute)
		return setAttribute(attribute, value)
	end
	for _k, _v in _exp do
		_callback(_v, _k, _exp)
	end
	-- ▲ ReadonlyMap.forEach ▲
	local changed = instance.AttributeChanged:Connect(function(attribute)
		local value = instance:GetAttribute(attribute)
		setAttribute(attribute, value)
	end)
	onCleanup(function()
		changed:Disconnect()
	end)
	return Proxy.new({}, {
		get = function(_, prop)
			return getAttribute(prop)
		end,
		set = function(_, prop, value)
			instance:SetAttribute(prop, value)
			setAttribute(prop, value)
			return true
		end,
		ownKeys = function()
			return Object.keys(attributes)
		end,
	})
end
local function createInterval(callback, interval)
	local intervalId = setInterval(callback, interval)
	onCleanup(function()
		return clearInterval(intervalId)
	end)
end
local function createTimeout(callback, timeout)
	local timeoutId = setTimeout(callback, timeout)
	onCleanup(function()
		return clearTimeout(timeoutId)
	end)
end
return {
	useInstanceAttributes = useInstanceAttributes,
	createInterval = createInterval,
	createTimeout = createTimeout,
}
