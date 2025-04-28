-- Compiled with roblox-ts v3.0.0
local TS = _G[script]
local Show = TS.import(script, script.Parent.Parent.Parent.Parent, "flow").Show
local SOLID = TS.import(script, script.Parent.Parent.Parent.Parent, "rendering").default
local Rounded = TS.import(script, script.Parent, "Rounded").Rounded
local function Bordered(props)
	return SOLID.createFragment(function()
		return SOLID.createElement(Show, SOLID.mergeProps({
			When = function()
				return props.BorderRadius ~= nil
			end,
		}), function()
			return SOLID.createElement(Rounded, SOLID.mergeProps({
				Radius = function()
					return props.BorderRadius
				end,
			}))
		end)
	end, function()
		return SOLID.createElement("instUIStroke", SOLID.mergeProps({
			ApplyStrokeMode = Enum.ApplyStrokeMode.Border,
			Thickness = function()
				local _condition = props.BorderWidth
				if _condition == nil then
					_condition = 0
				end
				return _condition
			end,
			Color = function()
				return props.BorderColor or Color3.new(1, 1, 1)
			end,
			Transparency = function()
				local _condition = props.BorderOpacity
				if _condition == nil then
					_condition = 1
				end
				return 1 - _condition
			end,
			Name = "Bordered",
		}))
	end)
end
return {
	Bordered = Bordered,
}
