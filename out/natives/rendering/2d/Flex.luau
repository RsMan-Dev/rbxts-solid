-- Compiled with roblox-ts v3.0.0
local TS = _G[script]
local createMemo = TS.import(script, TS.getModule(script, "@rbxts", "signals").out).createMemo
local _rendering = TS.import(script, script.Parent.Parent.Parent.Parent, "rendering")
local SOLID = _rendering.default
local omitProps = _rendering.omitProps
local splitProps = _rendering.splitProps
local number2UDim = TS.import(script, script.Parent.Parent, "utils", "number2UDim").number2UDim
local function align(horizontal, alignment)
	repeat
		if alignment == "start" then
			return if horizontal then Enum.HorizontalAlignment.Left else Enum.VerticalAlignment.Top
		end
		if alignment == "center" then
			return if horizontal then Enum.HorizontalAlignment.Center else Enum.VerticalAlignment.Center
		end
		if alignment == "end" then
			return if horizontal then Enum.HorizontalAlignment.Right else Enum.VerticalAlignment.Bottom
		end
		return if horizontal then Enum.HorizontalAlignment.Left else Enum.VerticalAlignment.Top
	until true
end
local function flexAlign(alignment)
	repeat
		if alignment == "space-between" then
			return Enum.UIFlexAlignment.SpaceBetween
		end
		if alignment == "space-around" then
			return Enum.UIFlexAlignment.SpaceAround
		end
		if alignment == "space-evenly" then
			return Enum.UIFlexAlignment.SpaceEvenly
		end
		if alignment == "stretch" then
			return Enum.UIFlexAlignment.Fill
		end
		return Enum.UIFlexAlignment.None
	until true
end
local function listAlign(alignment)
	repeat
		if alignment == "start" then
			return Enum.ItemLineAlignment.Start
		end
		if alignment == "center" then
			return Enum.ItemLineAlignment.Center
		end
		if alignment == "end" then
			return Enum.ItemLineAlignment.End
		end
		if alignment == "stretch" then
			return Enum.ItemLineAlignment.Stretch
		end
		return Enum.ItemLineAlignment.Stretch
	until true
end
local function Flexible(props)
	local mainAxisAlignment = createMemo(function()
		local direction = props.Direction or "horizontal"
		local horizontal = direction == "horizontal"
		return {
			[if horizontal then "HorizontalAlignment" else "VerticalAlignment"] = align(horizontal, props.MainAxisAlignment),
			[if horizontal then "HorizontalFlex" else "VerticalFlex"] = flexAlign(props.MainAxisAlignment),
		}
	end).accessor
	local crossAxisAlignment = createMemo(function()
		local direction = props.Direction or "horizontal"
		local horizontal = direction ~= "horizontal"
		return {
			[if horizontal then "HorizontalAlignment" else "VerticalAlignment"] = align(horizontal, props.CrossAxisAlignment),
			[if horizontal then "HorizontalFlex" else "VerticalFlex"] = flexAlign(props.CrossAxisAlignment),
		}
	end).accessor
	local fillDirection = createMemo(function()
		return if props.Direction == "vertical" then Enum.FillDirection.Vertical else Enum.FillDirection.Horizontal
	end)
	return SOLID.createElement("instUIListLayout", SOLID.mergeProps({
		FillDirection = fillDirection,
	}, mainAxisAlignment, crossAxisAlignment, {
		ItemLineAlignment = function()
			return listAlign(props.CrossAxisAlignment)
		end,
		Padding = function()
			return if props.Gap ~= nil then number2UDim(props.Gap) else UDim.new(0, 0)
		end,
		SortOrder = Enum.SortOrder.LayoutOrder,
		Name = "Flexible",
	}))
end
local function Flex(props)
	local _binding = splitProps(omitProps(props, { "Children" }), { "Direction", "MainAxisAlignment", "CrossAxisAlignment", "Gap" })
	local flexibleProps = _binding[1]
	local frameProps = _binding[2]
	return SOLID.createElement("instFrame", SOLID.mergeProps(frameProps, {
		Name = "Flex",
		Size = UDim2.new(0, 0, 0, 0),
		BackgroundTransparency = function()
			return if props.BackgroundColor3 ~= nil then 0 else 1
		end,
		BorderSizePixel = function()
			return if props.BorderColor3 ~= nil then 1 else 0
		end,
		AutomaticSize = Enum.AutomaticSize.XY,
	}), function()
		return SOLID.createElement(Flexible, SOLID.mergeProps(flexibleProps))
	end, function()
		return props.Children
	end)
end
return {
	Flexible = Flexible,
	Flex = Flex,
}
