-- Compiled with roblox-ts v3.0.0
local TS = _G[script]
local SOLID = TS.import(script, script.Parent, "rendering").default
local _signals = TS.import(script, TS.getModule(script, "@rbxts", "signals").out)
local createMemo = _signals.createMemo
local createRoot = _signals.createRoot
local createSignal = _signals.createSignal
local on = _signals.on
local onCleanup = _signals.onCleanup
local Object = TS.import(script, TS.getModule(script, "@rbxts", "jsnatives").out).Object
local function valFromKey(arrRaw, i)
	local v = arrRaw[i]
	-- TODO: add mutable when implemented
	-- if (!hasProxy(arrRaw)) return v;     // if not proxy array, return the value directly
	-- if (hasProxy(v)) return v;           // if proxy is initialized, return it
	-- untrack(() => withProxy(arrRaw)[i]); // to trigger the proxy creation
	return v
end
--[[
	*
	 * # FastFor
	 * FastFor is a for loop that avoid some heavy checks and is faster than the regular For component by not allowing
	 * duplicates and avoiding complex array mapping. For many caes, it's useless to be faster, but for rare case, it's a
	 * good optimization, for data that never gets duplicates, it's a free performance upgrade.
	 * It uses ways to ignore proxies and other Solid-js related stuff to be faster.
	 * @warn this For doesn't allow duplicates, if you have duplicates, only the first iteration of it will be kept.
	 
]]
local function FastFor(props)
	local memos = createMemo(function(curr)
		local newMap = {}
		local entries = {}
		local each = props.Each or {}
		for _, k in Object.keys(each) do
			local _arg0 = { valFromKey(each, k), k }
			table.insert(entries, _arg0)
		end
		for _, _binding in entries do
			local v = _binding[1]
			local i = _binding[2]
			if newMap[v] ~= nil then
				continue
			end
			local currV = curr[v]
			if currV then
				-- ▼ Map.delete ▼
				local _valueExisted = curr[v] ~= nil
				curr[v] = nil
				-- ▲ Map.delete ▲
				local _condition = _valueExisted
				if _condition then
					local _condition_1 = currV[2]((if type(i) == "number" then i - 1 else i))
					if not (_condition_1 ~= 0 and _condition_1 == _condition_1 and _condition_1 ~= "" and _condition_1) then
						_condition_1 = true
					end
					_condition = _condition_1
					if _condition ~= 0 and _condition == _condition and _condition ~= "" and _condition then
						newMap[v] = currV
						_condition = newMap
					end
				end
			else
				local disp
				local s = createSignal((if type(i) == "number" then i - 1 else i))
				local _arg1 = { createRoot(function(d)
					disp = d
					return props.Children(v, function()
						return s()
					end)
				end), s, disp }
				newMap[v] = _arg1
			end
		end
		for _, _binding in curr do
			local __ = _binding[1]
			local ___ = _binding[2]
			local disp = _binding[3]
			disp()
		end
		return newMap
	end, {})
	local function memoizedElements()
		local elements = {}
		for _, _binding in memos() do
			local v = _binding[1]
			table.insert(elements, v)
		end
		return elements
	end
	onCleanup(function()
		local _exp = memos()
		-- ▼ ReadonlyMap.forEach ▼
		local _callback = function(_param)
			local _ = _param[1]
			local __ = _param[2]
			local disp = _param[3]
			return disp()
		end
		for _k, _v in _exp do
			_callback(_v, _k, _exp)
		end
		-- ▲ ReadonlyMap.forEach ▲
		return nil
	end)
	-- TODO: fallback act wrongly, props seems to be glitched
	return SOLID.createFragment(function()
		-- ▼ ReadonlyMap.size ▼
		local _size = 0
		for _ in memos() do
			_size += 1
		end
		-- ▲ ReadonlyMap.size ▲
		return if _size == 0 then props.Fallback else memoizedElements()
	end)
end
local function Show(props)
	return createMemo(on(createMemo(function()
		return not not props.When
	end).accessor, function(when)
		if when then
			return props.Children
		end
		return props.Fallback
	end))()
end
return {
	FastFor = FastFor,
	Show = Show,
}
