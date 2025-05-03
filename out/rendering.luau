-- Compiled with roblox-ts v3.0.0
local TS = _G[script]
local _jsnatives = TS.import(script, TS.getModule(script, "@rbxts", "jsnatives").out)
local ArrayUtils = _jsnatives.ArrayUtils
local Object = _jsnatives.Object
local Proxy = _jsnatives.Proxy
local _signals = TS.import(script, TS.getModule(script, "@rbxts", "signals").out)
local createMemo = _signals.createMemo
local getOwner = _signals.getOwner
local untrack = _signals.untrack
local createInstance = TS.import(script, script.Parent, "natives", "createInstance").default
local MERGED = {}
local trueFn = function()
	return true
end
-- Interface who contains all utilities for jsx
local SOLID
SOLID = {
	debug = false,
	debugged = {
		["cleanup"] = true,
		["track"] = true,
		["create"] = true,
		["destroy"] = true,
	},
	canDebug = function(self, dbgType)
		local _condition = self.debug == true
		if _condition then
			local _debugged = self.debugged
			local _dbgType = dbgType
			_condition = _debugged[_dbgType] ~= nil
		end
		return _condition
	end,
	destroyDebug = function(self, ...)
		local elements = { ... }
		local _ = self:canDebug("destroy") and self:debugMessage("[DESTROY]", unpack(elements))
	end,
	createDebug = function(self, ...)
		local elements = { ... }
		local _ = self:canDebug("create") and self:debugMessage("[CREATE]", unpack(elements))
	end,
	trackDebug = function(self, ...)
		local elements = { ... }
		local _ = self:canDebug("track") and self:debugMessage("[TRACK]", unpack(elements))
	end,
	cleanupDebug = function(self, ...)
		local elements = { ... }
		local _ = self:canDebug("cleanup") and self:debugMessage("[CLEANUP]", unpack(elements))
	end,
	debugMessage = function(self, ...)
		local elements = { ... }
		local _ = self.debug and print("[SOLID-DEBUG]", unpack(elements))
	end,
	createElement = function(key, attributes, ...)
		local children = { ... }
		if not getOwner() then
			error("No element will be created, no owner found")
		else
			SOLID:trackDebug(`Owned element creation`, key)
		end
		-- for functional component context
		local _key = key
		if type(_key) == "function" then
			SOLID:createDebug(`Creating functional component`)
			return untrack(function()
				local _fn = key
				local _value = attributes[MERGED]
				return _fn(SOLID.mergeProps(if not (_value ~= 0 and _value == _value and _value ~= "" and _value) then function()
					return attributes
				end else attributes, {
					Children = function()
						-- ▼ ReadonlyArray.map ▼
						local _newValue = table.create(#children)
						local _callback = function(child)
							local _child = child
							return if type(_child) == "function" then createMemo(child).accessor else child
						end
						for _k, _v in children do
							_newValue[_k] = _callback(_v, _k - 1, children)
						end
						-- ▲ ReadonlyArray.map ▲
						local memoizedChildren = _newValue
						if #memoizedChildren == 0 then
							return nil
						elseif #memoizedChildren == 1 then
							local _arg0 = memoizedChildren[1]
							return if type(_arg0) == "function" then memoizedChildren[1]() else memoizedChildren[1]
						else
							-- ▼ ReadonlyArray.map ▼
							local _newValue_1 = table.create(#memoizedChildren)
							local _callback_1 = function(child)
								local _child = child
								return if type(_child) == "function" then child() else child
							end
							for _k, _v in memoizedChildren do
								_newValue_1[_k] = _callback_1(_v, _k - 1, memoizedChildren)
							end
							-- ▲ ReadonlyArray.map ▲
							return _newValue_1
						end
					end,
				}))
			end)
		end
		return createInstance(SOLID, key, attributes, unpack(children))
	end,
	createFragment = function(...)
		local children = { ... }
		if not getOwner() then
			error("No element will be created, no owner found")
		end
		return createMemo(function()
			-- ▼ ReadonlyArray.map ▼
			local _newValue = table.create(#children)
			local _callback = function(child)
				local _child = child
				return if type(_child) == "function" then child() else child
			end
			for _k, _v in children do
				_newValue[_k] = _callback(_v, _k - 1, children)
			end
			-- ▲ ReadonlyArray.map ▲
			return _newValue
		end)()
	end,
	mergeProps = function(...)
		local sources = { ... }
		local target = {}
		local size = #sources
		for i = 0, size do
			local s = sources[i + 1]
			sources[i + 1] = if type(s) == "function" then createMemo(s).accessor else s
		end
		local get
		local ownKeys
		-- if size is 1, unwrap the array and create simplified functions
		if size == 1 then
			local source = sources[1]
			if Object.isCallable(source) then
				get = function(_, key)
					return source()[key]
				end
				ownKeys = function()
					return Object.keys(source())
				end
			elseif source[MERGED] then
				get = function(_, key)
					return source[key]
				end
				ownKeys = function()
					return Object.keys(source)
				end
			else
				get = function(_, key)
					local s = source[key]
					if Object.isCallable(s) then
						return s()
					end
					return s
				end
				ownKeys = function()
					return Object.keys(source)
				end
			end
		else
			get = function(_, key)
				local found = false
				for i = 0, size do
					local source = sources[i + 1]
					if source == nil then
						continue
					end
					if Object.isCallable(source) then
						source = source()[key]
						found = source ~= nil
					else
						local merged = source[MERGED]
						source = source[key]
						found = source ~= nil
						if not merged and Object.isCallable(source) then
							source = source()
						end
					end
					if found then
						return source
					end
				end
			end
			ownKeys = function()
				local keys = {}
				for _, source in sources do
					local el = if Object.isCallable(source) then source() else source
					for _1, key in Object.keys(el) do
						keys[key] = true
					end
				end
				local _array = {}
				local _length = #_array
				for _v in keys do
					_length += 1
					_array[_length] = _v
				end
				return _array
			end
		end
		return Proxy.new(target, {
			get = get,
			ownKeys = ownKeys,
			set = trueFn,
		}, {
			[MERGED] = true,
		})
	end,
	pickProps = function(props, picked)
		local target = {}
		local _set = {}
		for _, _v in picked do
			_set[_v] = true
		end
		local pickedSet = _set
		return Proxy.new(target, {
			get = function(_, prop)
				local _prop = prop
				if pickedSet[_prop] ~= nil then
					return props[prop]
				end
			end,
			set = function(_, prop, value)
				local _prop = prop
				if pickedSet[_prop] ~= nil then
					props[prop] = value
				end
				return true
			end,
			ownKeys = function()
				local keys = {}
				for _, key in Object.keys(props) do
					if pickedSet[key] ~= nil then
						keys[key] = true
					end
				end
				local _array = {}
				local _length = #_array
				for _v in keys do
					_length += 1
					_array[_length] = _v
				end
				return _array
			end,
		})
	end,
	omitProps = function(props, omited)
		local target = {}
		local _set = {}
		for _, _v in omited do
			_set[_v] = true
		end
		local omitedSet = _set
		return Proxy.new(target, {
			get = function(_, prop)
				local _prop = prop
				if not (omitedSet[_prop] ~= nil) then
					return props[prop]
				end
			end,
			set = function(_, prop, value)
				local _prop = prop
				if not (omitedSet[_prop] ~= nil) then
					props[prop] = value
				end
				return true
			end,
			ownKeys = function()
				local keys = {}
				for _, key in Object.keys(props) do
					if not (omitedSet[key] ~= nil) then
						keys[key] = true
					end
				end
				local _array = {}
				local _length = #_array
				for _v in keys do
					_length += 1
					_array[_length] = _v
				end
				return _array
			end,
		})
	end,
	splitProps = function(props, keys)
		return { SOLID.pickProps(props, keys), SOLID.omitProps(props, keys) }
	end,
	unwrapChildren = function(children)
		local _children = children
		if type(_children) == "function" then
			children = children()
		end
		if ArrayUtils.isArray(children) then
			-- ▼ ReadonlyArray.map ▼
			local _newValue = table.create(#children)
			local _callback = function(child)
				local _child = child
				if type(_child) == "function" then
					child = child()
				end
				if ArrayUtils.isArray(child) then
					return SOLID.unwrapChildren(child)
				end
				return child
			end
			for _k, _v in children do
				_newValue[_k] = _callback(_v, _k - 1, children)
			end
			-- ▲ ReadonlyArray.map ▲
			return _newValue
		end
		return children
	end,
}
local _binding = SOLID
local mergeProps = _binding.mergeProps
local pickProps = _binding.pickProps
local omitProps = _binding.omitProps
local splitProps = _binding.splitProps
local unwrapChildren = _binding.unwrapChildren
local default = SOLID
return {
	mergeProps = mergeProps,
	pickProps = pickProps,
	omitProps = omitProps,
	splitProps = splitProps,
	unwrapChildren = unwrapChildren,
	default = default,
}
