-- Compiled with roblox-ts v3.0.0
local TS = _G[script]
local _signals = TS.import(script, TS.getModule(script, "@rbxts", "signals").out)
local createEffect = _signals.createEffect
local onCleanup = _signals.onCleanup
local untrack = _signals.untrack
local createContext = _signals.createContext
local getOwner = _signals.getOwner
local disposeNode = _signals.disposeNode
local createComputation = _signals.createComputation
local Workspace = TS.import(script, TS.getModule(script, "@rbxts", "services")).Workspace
local Object = TS.import(script, TS.getModule(script, "@rbxts", "jsnatives").out).Object
-- 
local InstanceContext = createContext(nil)
local function runWithInstance(instance, callback)
	return InstanceContext:apply(instance, callback)
end
local function getInstance()
	return InstanceContext:getValue()
end
local function ProvideInstance(props)
	return InstanceContext:Provider(props)
end
local function createInstance(SOLID, key, attributes, ...)
	local children = { ... }
	local _key = key
	local _condition = type(_key) == "string"
	if _condition then
		_condition = (string.find(key, "^inst")) ~= nil
	end
	local _condition_1 = not _condition
	if _condition_1 then
		local _key_1 = key
		_condition_1 = not (typeof(_key_1) == "Instance")
	end
	if _condition_1 then
		return nil
	end
	local element
	local parent = getInstance()
	local destroyable = false
	local _parent = parent
	if not (typeof(_parent) == "Instance") then
		if parent ~= nil then
			print(`[SOLID] Tried to create an instance with a non-instance parent, fallbacked to Workspace`, parent)
		end
		parent = Workspace
	end
	local _key_1 = key
	if type(_key_1) == "string" then
		element = Instance.new(string.sub(key, 5), parent)
		SOLID:createDebug(`Creating new instance element`)
		destroyable = true
	else
		element = key
	end
	return InstanceContext:apply(element, function()
		SOLID:trackDebug(`Mounting new instance element`)
		local node = getOwner()
		local destroying = element.Destroying:Once(function()
			SOLID:destroyDebug(`Instance element destroyed, disposing root graph`, element)
			disposeNode(node)
		end)
		onCleanup(function()
			SOLID:cleanupDebug(`Cleaning up instance element`)
			destroying:Disconnect()
			if not destroyable then
				return nil
			end
			SOLID:destroyDebug(`Destroying {key}`)
			TS.try(function()
				element:Destroy()
			end, function()
				SOLID:destroyDebug(`Failed to destroy {key}`)
			end)
		end)
		-- when in future, props signals changes, will be captured by this effect
		createEffect(function()
			-- tracks mutable objects
			local _ = attributes.__track
			SOLID:trackDebug(`Mounting instance attributes`)
			-- number keys are transformed to string, even if no number key is normally possible
			for _1, k in Object.keys(attributes) do
				if k == "Children" then
					continue
				end
				-- ref is a special case, as it is not an attribute but a function, to get the instance
				if k == "Ref" then
					createEffect(function()
						SOLID:trackDebug(`Tracking instance element ref`)
						local ref = attributes[k]
						if type(ref) == "function" then
							untrack(function()
								return ref(element, element)
							end)
						end
					end)
					continue
				end
				-- attribute  keys
				local prefix = (select(3, string.find(k, "^(%a+):")))
				-- removing prefix, and re-adding Getter and Setter naming
				local key = if prefix ~= "" and prefix then string.sub(k, #prefix + 2) else k
				key = (if prefix == "set" then "Set" elseif prefix == "get" then "Get" else "") .. key
				createEffect(function()
					SOLID:trackDebug(`Tracking instance element attribute {k}`)
					local value = attributes[k]
					-- attribute definition
					if prefix == nil then
						TS.try(function()
							element[key] = value
						end, function(e)
							warn(`[SOLID] Tried to set attribute {k} to {value}, but failed: {e}, on:`, element)
						end)
						return nil
					end
					-- These more complex attributes are in the same effect, as normally they are not
					-- changed too much, as callbacks and any other function don't change directly
					--getter and setter and function
					if prefix == "set" or prefix == "get" or prefix == "fn" then
						local elementPropFunction = element[key]
						local _elementPropFunction = elementPropFunction
						if type(_elementPropFunction) == "function" then
							-- if we pass function as value, so we act as a getter, and we ref the getter
							if type(value) == "function" then
								value(function(...)
									local args = { ... }
									local _result = elementPropFunction
									if _result ~= nil then
										_result = _result(element, unpack(args))
									end
									return _result
								end)
								SOLID:createDebug(`Given {if prefix == "get" then "getter" else "function"} {k} to jsx's ref`, element)
								onCleanup(function()
									elementPropFunction = nil
									SOLID:cleanupDebug(`Disconnected {if prefix == "get" then "getter" else "function"} {k} from an instance`)
								end)
							else
								if Object.isArray(value) then
									elementPropFunction(element, unpack(value))
								else
									elementPropFunction(element, value)
								end
								SOLID:createDebug(`Used values in setter {k} to instance`, element)
							end
						end
					elseif prefix == "on" or prefix == "once" or prefix == "parallel" then
						local elementPropEvent = element[key]
						local signal = elementPropEvent
						local fn
						-- if element prop is a function that means the signal is got using the value as [...functionParams, callback]
						local _elementPropEvent = elementPropEvent
						if type(_elementPropEvent) == "function" then
							-- ▼ Array.pop ▼
							local _length = #value
							local _result = value[_length]
							value[_length] = nil
							-- ▲ Array.pop ▲
							fn = _result
							signal = elementPropEvent(element, unpack(value))
							-- else we consider the elementProp as a signal and the value as a callback
						else
							fn = value
						end
						local connection
						local owner
						local owner = getOwner()
						local callback = function(...)
							local args = { ... }
							local _result = owner
							if _result ~= nil then
								_result = _result:apply(function()
									return fn(element, unpack(args))
								end)
							end
							return _result
						end
						-- register the callback to the signal, using the type event provided by the prefix
						if prefix == "once" then
							connection = signal:Once(function(...)
								local args = { ... }
								return callback(element, unpack(args))
							end)
						elseif prefix == "parallel" then
							connection = signal:ConnectParallel(function(...)
								local args = { ... }
								return callback(element, unpack(args))
							end)
						else
							connection = signal:Connect(function(...)
								local args = { ... }
								return callback(element, unpack(args))
							end)
						end
						SOLID:createDebug(`Connected event {k} to an instance`, element)
						-- disconnect the signal when the element or attribute is cleaned up
						-- (in case of function change, for example)
						onCleanup(function()
							local _result = connection
							if _result ~= nil then
								_result:Disconnect()
							end
							connection = nil
							signal = nil
							fn = nil
							SOLID:destroyDebug(`Disconnected event {k} from an instance`)
						end)
					end
					onCleanup(function()
						return SOLID:cleanupDebug(`Cleaned up instance element attribute {k}`)
					end)
				end)
			end
			onCleanup(function()
				return SOLID:cleanupDebug(`Cleaned up instance element attributes`)
			end)
		end)
		-- const mappedChildren =  
		-- ▼ ReadonlyArray.map ▼
		local _newValue = table.create(#children)
		local _callback = function(child)
			local _child = child
			return if type(_child) == "function" then createComputation(child, nil, false, false) else child
		end
		for _k, _v in children do
			_newValue[_k] = _callback(_v, _k - 1, children)
		end
		-- ▲ ReadonlyArray.map ▲
		return element
	end)
end
return {
	runWithInstance = runWithInstance,
	getInstance = getInstance,
	ProvideInstance = ProvideInstance,
	default = createInstance,
	InstanceContext = InstanceContext,
}
