-- Compiled with roblox-ts v3.0.0
local TS = _G[script]
local exports = {}
local SOLID = TS.import(script, script, "rendering").default
for _k, _v in TS.import(script, script, "natives") or {} do
	exports[_k] = _v
end
for _k, _v in TS.import(script, script, "flamework") or {} do
	exports[_k] = _v
end
for _k, _v in TS.import(script, script, "bridge") or {} do
	exports[_k] = _v
end
for _k, _v in TS.import(script, script, "rendering") or {} do
	exports[_k] = _v
end
for _k, _v in TS.import(script, script, "flow") or {} do
	exports[_k] = _v
end
local default = SOLID
exports.default = default
return exports
