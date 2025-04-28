-- Compiled with roblox-ts v3.0.0
local TS = _G[script]
local SOLID = TS.import(script, script.Parent.Parent.Parent.Parent, "rendering").default
local number2UDim = TS.import(script, script.Parent.Parent, "utils", "number2UDim").default
local function Rounded(props)
	return SOLID.createElement("instUICorner", SOLID.mergeProps({
		CornerRadius = function()
			local _condition = props.Radius
			if _condition == nil then
				_condition = 0
			end
			return number2UDim(_condition)
		end,
		Name = "Rounded",
	}))
end
return {
	Rounded = Rounded,
}
