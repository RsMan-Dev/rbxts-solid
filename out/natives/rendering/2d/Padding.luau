-- Compiled with roblox-ts v3.0.0
local TS = _G[script]
local Show = TS.import(script, script.Parent.Parent.Parent.Parent, "flow").Show
local SOLID = TS.import(script, script.Parent.Parent.Parent.Parent, "rendering").default
local number2UDim = TS.import(script, script.Parent.Parent, "utils", "number2UDim").default
local createMemo = TS.import(script, TS.getModule(script, "@rbxts", "signals").out).createMemo
local function convertPaddingLike(padding)
	if padding == nil then
		padding = 0
	end
	local _padding = padding
	local _condition = type(_padding) == "table"
	if _condition then
		_condition = not (padding.Offset ~= nil) and #padding == 0
	end
	if _condition then
		padding = 0
	end
	local _padding_1 = padding
	local _condition_1 = type(_padding_1) == "table"
	if _condition_1 then
		_condition_1 = not (padding.Offset ~= nil)
	end
	if _condition_1 then
		local top = number2UDim(padding[1])
		local _condition_2 = padding[2]
		if _condition_2 == nil then
			_condition_2 = top
		end
		local right = number2UDim(_condition_2)
		local _condition_3 = padding[3]
		if _condition_3 == nil then
			_condition_3 = top
		end
		local bottom = number2UDim(_condition_3)
		local _condition_4 = padding[4]
		if _condition_4 == nil then
			_condition_4 = right
		end
		local left = number2UDim(_condition_4)
		return { top, right, bottom, left }
	else
		local val = number2UDim(padding)
		return { val, val, val, val }
	end
end
local function Padded(props)
	local padding = createMemo(function()
		return convertPaddingLike(props.Padding)
	end).accessor
	return SOLID.createElement(Show, SOLID.mergeProps({
		When = function()
			return padding() ~= nil
		end,
	}), function()
		return SOLID.createElement("instUIPadding", SOLID.mergeProps({
			PaddingTop = function()
				return padding()[1]
			end,
			PaddingRight = function()
				return padding()[2]
			end,
			PaddingBottom = function()
				return padding()[3]
			end,
			PaddingLeft = function()
				return padding()[4]
			end,
			Name = "Padded",
		}))
	end)
end
local function Padding(props)
	local padding = createMemo(function()
		return convertPaddingLike(props.Padding)
	end).accessor
	local testObj = {
		test = function(self)
			return nil
		end,
	}
	return SOLID.createElement("instFrame", {
		Name = "Padding",
	}, function()
		return SOLID.createElement(Padded, SOLID.mergeProps({
			Padding = padding,
			test = function()
				return testObj:test()
			end,
		}))
	end, function()
		return props.children
	end)
end
return {
	convertPaddingLike = convertPaddingLike,
	Padded = Padded,
	Padding = Padding,
}
