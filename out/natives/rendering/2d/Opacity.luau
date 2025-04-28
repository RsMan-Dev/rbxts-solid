-- Compiled with roblox-ts v3.0.0
local TS = _G[script]
local Show = TS.import(script, script.Parent.Parent.Parent.Parent, "flow").Show
local _rendering = TS.import(script, script.Parent.Parent.Parent.Parent, "rendering")
local SOLID = _rendering.default
local omitProps = _rendering.omitProps
local splitProps = _rendering.splitProps
local function Opacity(props)
	local _binding = splitProps(omitProps(props, { "Children" }), { "Opacity" })
	local opacityProps = _binding[1]
	local frameProps = _binding[2]
	return SOLID.createElement(Show, SOLID.mergeProps({
		When = function()
			return opacityProps.Opacity ~= nil
		end,
		Fallback = function()
			return SOLID.createElement("instFrame", SOLID.mergeProps(frameProps, {
				AutomaticSize = Enum.AutomaticSize.XY,
				Name = "Opacity_Fallback",
			}), function()
				return props.Children
			end)
		end,
	}), function()
		return SOLID.createElement("instCanvasGroup", SOLID.mergeProps(frameProps, {
			Name = "Opacity",
			AutomaticSize = Enum.AutomaticSize.XY,
			GroupTransparency = function()
				return 1 - opacityProps.Opacity
			end,
		}), function()
			return props.Children
		end)
	end)
end
return {
	Opacity = Opacity,
}
