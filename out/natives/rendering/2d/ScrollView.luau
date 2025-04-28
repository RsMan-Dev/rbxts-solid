-- Compiled with roblox-ts v3.0.0
local TS = _G[script]
local _signals = TS.import(script, TS.getModule(script, "@rbxts", "signals").out)
local createEffect = _signals.createEffect
local createMemo = _signals.createMemo
local SOLID = TS.import(script, script.Parent.Parent.Parent.Parent, "rendering").default
local function ScrollView(props)
	local sref
	local ref
	local maxSize = props.MaxSize
	createEffect(function()
		maxSize = props.MaxSize
		return maxSize
	end)
	local scrollBarThickness = createMemo(function()
		local _condition = props.ScrollBarThickness
		if _condition == nil then
			_condition = 4
		end
		return _condition
	end).accessor
	local scrollPadding = function()
		return scrollBarThickness() + 1
	end
	return SOLID.createElement("instFrame", {
		Name = "ScrollView_Constraints",
		Ref = (function(r)
			ref = r
			return ref
		end),
		Transparency = 1,
		Size = UDim2.new(1, 0, 1, 0),
	}, function()
		return SOLID.createElement("instScrollingFrame", SOLID.mergeProps({
			Ref = function()
				return function(r)
					sref = r
					return sref
				end
			end,
			Name = "ScrollView_ScrollingFrame",
			Transparency = 1,
			Size = UDim2.new(1, 0, 1, 0),
			ScrollingEnabled = function()
				return props.Direction ~= "none"
			end,
			CanvasSize = UDim2.new(1, -scrollPadding(), 1, -scrollPadding()),
			ScrollBarThickness = scrollBarThickness,
			VerticalScrollBarInset = Enum.ScrollBarInset.ScrollBar,
			HorizontalScrollBarInset = Enum.ScrollBarInset.ScrollBar,
			BorderSizePixel = 0,
			ScrollingDirection = function()
				return if props.Direction == "x" then Enum.ScrollingDirection.X elseif props.Direction == "y" then Enum.ScrollingDirection.Y else Enum.ScrollingDirection.XY
			end,
			AutomaticCanvasSize = Enum.AutomaticSize.XY,
		}), function()
			return SOLID.createElement("instFrame", SOLID.mergeProps({
				Name = "ScrollView_Content_Updater",
				AutomaticSize = Enum.AutomaticSize.XY,
				Transparency = 1,
				["on:GetPropertyChangedSignal"] = function()
					return { "AbsoluteSize", function(inst)
						local _absoluteSize = inst.AbsoluteSize
						local _vector2 = Vector2.new(scrollPadding() + 3, scrollPadding() + 3)
						local size = _absoluteSize + _vector2
						ref.Size = UDim2.new(0, if maxSize ~= nil and maxSize.X < size.X then maxSize.X else size.X, 0, if maxSize ~= nil and maxSize.Y < size.Y then maxSize.Y else size.Y)
					end }
				end,
			}), function()
				return props.Children
			end)
		end)
	end)
end
return {
	ScrollView = ScrollView,
}
