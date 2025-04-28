-- Compiled with roblox-ts v3.0.0
local TS = _G[script]
local exports = {}
local createInstance = TS.import(script, script, "createInstance").default
for _k, _v in TS.import(script, script, "flow") or {} do
	exports[_k] = _v
end
for _k, _v in TS.import(script, script, "rendering") or {} do
	exports[_k] = _v
end
local default = createInstance
exports.default = default
return exports
