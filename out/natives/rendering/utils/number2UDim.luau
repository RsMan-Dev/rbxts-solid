-- Compiled with roblox-ts v3.0.0
local function number2UDim(value)
	local _value = value
	if type(_value) == "number" then
		return UDim.new(0, value)
	else
		return value
	end
end
return {
	number2UDim = number2UDim,
}
