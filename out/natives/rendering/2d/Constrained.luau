-- Compiled with roblox-ts v3.0.0
local TS = _G[script]
local Show = TS.import(script, script.Parent.Parent.Parent.Parent, "flow").Show
local SOLID = TS.import(script, script.Parent.Parent.Parent.Parent, "rendering").default
local function Constrained(props)
	return SOLID.createElement(Show, SOLID.mergeProps({
		When = function()
			return props.MinSize ~= nil or props.MaxSize ~= nil
		end,
	}), function()
		return SOLID.createElement("instUISizeConstraint", SOLID.mergeProps(function()
			return if props.MinSize ~= nil and props.MaxSize ~= nil then {
				MinSize = props.MinSize,
				MaxSize = props.MaxSize,
			} elseif props.MinSize ~= nil then {
				MinSize = props.MinSize,
			} elseif props.MaxSize ~= nil then {
				MaxSize = props.MaxSize,
			} else {}
		end, {
			Name = "Constrained",
		}))
	end)
end
return {
	Constrained = Constrained,
}
