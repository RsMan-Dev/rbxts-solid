-- Compiled with roblox-ts v3.0.0
local TS = _G[script]
local BaseComponent = TS.import(script, TS.getModule(script, "@flamework", "components").out).BaseComponent
local _signals = TS.import(script, TS.getModule(script, "@rbxts", "signals").out)
local disposeNode = _signals.disposeNode
local getCandidateNode = _signals.getCandidateNode
local runWithOwner = _signals.runWithOwner
local InstanceContext = TS.import(script, script.Parent.Parent, "natives", "createInstance").InstanceContext
--[[
	*
	 * Populate a computation node owner to the Reactive base, to be able to use it in
	 * Lifecycle functions, populated by utils functions next.
	 * @param el - The element to populate with the owner
	 * @returns
	 
]]
local function populateReactiveBaseRoot(el)
	if el.owner ~= nil then
		return el
	end
	-- if the owner is a BaseComponent, he has an instance who potentially has an owner
	-- we find it, if not instance, we use the candidate node
	el.owner = getCandidateNode()
	-- If container is a BaseComponent, we need to dispose the owner when the container is destroyed
	-- so we populate the destroy function of the container with a function that disposes the owner
	if not (el.destroy ~= nil) then
		return el
	end
	local oldDestroy = el.destroy
	el.destroy = function()
		disposeNode(el.owner)
		local _result = oldDestroy
		if _result ~= nil then
			_result(el)
		end
	end
	return el
end
local function populateReactiveRootLifecycles(el)
	if el.onInit ~= nil then
		local oldOnInit = el.onInit
		el.onInit = function(...)
			local args = { ... }
			return runWithOwner(el.owner, function()
				return oldOnInit(el, unpack(args))
			end)
		end
	end
	if el.onStart ~= nil then
		local oldOnStart = el.onStart
		el.onStart = function(...)
			local args = { ... }
			return runWithOwner(el.owner, function()
				return oldOnStart(el, unpack(args))
			end)
		end
	end
	if el.onTick ~= nil then
		local oldOnTick = el.onTick
		el.onTick = function(...)
			local args = { ... }
			return runWithOwner(el.owner, function()
				return oldOnTick(el, unpack(args))
			end)
		end
	end
	if el.onPhysics ~= nil then
		local oldOnPhysics = el.onPhysics
		el.onPhysics = function(...)
			local args = { ... }
			return runWithOwner(el.owner, function()
				return oldOnPhysics(el, unpack(args))
			end)
		end
	end
	if el.onRender ~= nil then
		local oldOnRender = el.onRender
		el.onRender = function(...)
			local args = { ... }
			return runWithOwner(el.owner, function()
				return oldOnRender(el, unpack(args))
			end)
		end
	end
	return el
end
--[[
	*
	 * # ReactiveBase
	 * ReactiveBase is a base class that wraps an owner in lifecycle functions, to help using SOLID in Flamework.
	 *
	 * @example
	 * ```ts
	 * class MyComponent extends ReactiveBase implements OnStart {
	 *
	 *  onStart() {
	 *    return <>
	 *      ...
	 *    </>
	 *  }
	 * }
	 * ```
	 
]]
local ReactiveBase
do
	ReactiveBase = {}
	function ReactiveBase:constructor()
		populateReactiveBaseRoot(self)
		populateReactiveRootLifecycles(self)
	end
end
--[[
	*
	 * # ReactiveComponent
	 * ReactiveComponent is a base class that wraps an owner in lifecycle functions, to help using SOLID in Flamework.
	 *
	 * @example
	 * ```ts
	 * class MyComponent extends ReactiveComponent<{}, Frame> implements OnStart {
	 *
	 *  onStart() {
	 *    return <>
	 *      ...
	 *    </>
	 *  }
	 * }
	 
]]
local ReactiveComponent
do
	local super = BaseComponent
	ReactiveComponent = setmetatable({}, {
		__tostring = function()
			return "ReactiveComponent"
		end,
		__index = super,
	})
	ReactiveComponent.__index = ReactiveComponent
	function ReactiveComponent:constructor()
		super.constructor(self)
		populateReactiveBaseRoot(self)
		self.owner:apply(function()
			return InstanceContext:populate(self.instance)
		end)
		populateReactiveRootLifecycles(self)
	end
end
return {
	ReactiveBase = ReactiveBase,
	ReactiveComponent = ReactiveComponent,
}
