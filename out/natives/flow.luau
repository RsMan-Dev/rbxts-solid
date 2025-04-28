-- Compiled with roblox-ts v3.0.0
local TS = _G[script]
local _rendering = TS.import(script, script.Parent.Parent, "rendering")
local SOLID = _rendering.default
local omitProps = _rendering.omitProps
local _signals = TS.import(script, TS.getModule(script, "@rbxts", "signals").out)
local createMemo = _signals.createMemo
local onCleanup = _signals.onCleanup
local createSignal = _signals.createSignal
local createEffect = _signals.createEffect
local batch = _signals.batch
local getOwner = _signals.getOwner
local createComputation = _signals.createComputation
local disposeNode = _signals.disposeNode
local _createInstance = TS.import(script, script.Parent, "createInstance")
local createInstance = _createInstance.default
local getInstance = _createInstance.getInstance
local InstanceContext = _createInstance.InstanceContext
--[[
	*
	 * Ref component to manipulate an element in jsx context, using basic jsx props,
	 * as it was created by jsx. It will not be destroyed when the parent is destroyed,
	 * ref will be disposed with its children when the parent is destroyed.
	 * The target element will be moved to the parent of the Ref component, then on dispose,
	 * it will be moved back to its original parent, if it can be.
	 *
	 * @warn Only one Ref component can manipulate an element at a time as only one computation node be populated by one unique instance.
	 * @param props The props to pass to the Ref component
	 * @returns Element
	 
]]
local function Ref(props)
	local omited = omitProps(props, { "Element", "Children" })
	return createMemo(function()
		local el = props.Element
		if not el then
			return nil
		end
		return createInstance(SOLID, props.Element, omited, function()
			return props.Children
		end)
	end)()
end
--[[
	*
	 * Same as {@link Ref}, but the element will be cloned, without altering the original element.
	 * The cloned element will be moved to the parent of the Ref component, then on dispose,
	 * it will be destroyed.
	 * @param props The props to pass to the Ref component
	 * @returns Element
	 
]]
local function Cloned(props)
	local element = createMemo(function()
		local el = props.Element
		if not el then
			return nil
		end
		local cloned = el:Clone()
		-- if destroyed, will fail, not a problem
		TS.try(function()
			cloned.Parent = getInstance()
		end, function() end)
		onCleanup(function()
			return cloned:Destroy()
		end)
		return cloned
	end)
	return SOLID.createElement(Ref, SOLID.mergeProps(function()
		return {
			Element = element(),
		}
	end, function()
		return omitProps(props, { "Element", "Children" })
	end), function()
		return props.Children
	end)
end
--[[
	*
	 * Find an element from a parent and a path
	 * @param parent The parent instance to search from
	 * @param path The path to the element, relative to the parent
	 * @returns The element found freezes if not found, as it waits for it to be created
	 
]]
local function findElFromParentAndPath(parent, path)
	if not parent or not (path ~= "" and path) then
		return nil
	end
	local pathSteps = string.split(path, ".")
	local el = parent
	for _, step in pathSteps do
		if not el then
			return nil
		end
		el = el:WaitForChild(step)
	end
	if not el then
		return nil
	end
	return el
end
--[[
	*
	 * Find an element from a path relative to the parent, and will {@link Ref} it.
	 * If moveTargetToIt is true, the target will be moved to the parent of the Ref component.
	 * @param parent The parent instance to search from
	 * @param path The path to the element, relative to the parent
	 * @param moveTargetToIt If true, the target will be moved Ref's current parent
	 * @returns The element found, or undefined if not found
	 * @example
	 * ```tsx
	 * <RefPath path="MyFolder.MyPart" mooveParentToIt={true}>
	 *   <instPart />
	 * </RefPath>
	 * ```
	 * This will find the part MyPart in the folder MyFolder, and move the parent to it
	*
]]
local function RefPath(props)
	local parent = getInstance()
	local element = createSignal(nil)
	createEffect(function()
		local path = props.Path
		if not (path ~= "" and path) then
			element(nil)
		else
			TS.async(function()
				local el = findElFromParentAndPath(parent, path)
				element(el)
			end)():andThen()
		end
	end)
	return SOLID.createElement(Ref, SOLID.mergeProps(function()
		return {
			Element = element(),
		}
	end, function()
		return omitProps(props, { "Path", "Children" })
	end), function()
		return props.Children
	end)
end
--[[
	*
	 * Same actions as {@link RefPath} and {@link Cloned} combined
	 * @param props The props to pass to the Ref component
	 * @returns
	 
]]
local function ClonedPath(props)
	local parent = getInstance()
	local element = createSignal(nil)
	createEffect(function()
		local path = props.Path
		if not (path ~= "" and path) then
			element(nil)
		else
			TS.async(function()
				local el = findElFromParentAndPath(parent, path)
				batch(function()
					return element(el)
				end)
			end)():andThen()
		end
	end)
	return SOLID.createElement(Cloned, SOLID.mergeProps(function()
		return {
			Element = element(),
		}
	end, function()
		return omitProps(props, { "Path", "Children" })
	end), function()
		return props.Children
	end)
end
local function RefPredicate(props)
	local parent = getInstance()
	local owner = getOwner()
	local omited = omitProps(props, { "Tag", "Predicate", "TrackAttributes", "Children" })
	if not parent or not owner then
		return nil
	end
	local predicate = createMemo(function()
		local pred = props.Predicate
		local tag = props.Tag
		if tag == nil and pred == nil then
			return nil
		end
		return function(el)
			local allow = true
			if tag ~= nil then
				allow = el:HasTag(tag) and allow
			end
			if pred ~= nil then
				allow = pred(el) and allow
			end
			return allow
		end
	end)
	local descendantsTracks = {}
	local children = {}
	local function removeChild(el)
		local _el = el
		if not (children[_el] ~= nil) then
			return nil
		end
		local _el_1 = el
		local state = children[_el_1]
		if state ~= nil then
			state.dispose()
			local _el_2 = el
			children[_el_2] = nil
		end
	end
	local function addChild(el)
		local _el = el
		if children[_el] ~= nil then
			return nil
		end
		local _binding = owner:apply(function()
			return createComputation(function()
				InstanceContext:populate(el)
				return createInstance(SOLID, el, omited, function()
					local _condition = props.Children
					if _condition == nil then
						_condition = {}
					end
					return _condition
				end)
			end, nil, true, false)
		end)
		local node = _binding.node
		local _el_1 = el
		children[_el_1] = {
			dispose = function()
				return disposeNode(node)
			end,
		}
	end
	local addConnection = parent.DescendantAdded:Connect(function(el)
		local _result = predicate()
		if _result ~= nil then
			_result = _result(el)
		end
		if _result == true then
			addChild(el)
		end
		local _el = el
		if descendantsTracks[_el] ~= nil then
			return nil
		end
		local connections = {}
		local _changed = (el.Changed)
		if _changed ~= nil then
			_changed = _changed:Connect(function()
				local _result_1 = predicate()
				if _result_1 ~= nil then
					_result_1 = _result_1(el)
				end
				if not _result_1 then
					removeChild(el)
				else
					addChild(el)
				end
			end)
		end
		local changed = _changed
		local attributeChanged = el.AttributeChanged:Connect(function()
			if not props.TrackAttributes then
				return nil
			end
			local _result_1 = predicate()
			if _result_1 ~= nil then
				_result_1 = _result_1(el)
			end
			if not _result_1 == true then
				removeChild(el)
			else
				addChild(el)
			end
		end)
		if changed ~= nil then
			table.insert(connections, changed)
		end
		table.insert(connections, attributeChanged)
	end)
	local removeConnection = parent.DescendantRemoving:Connect(function(el)
		removeChild(el)
		local _el = el
		local connections = descendantsTracks[_el]
		if connections ~= nil then
			for _, connection in connections do
				connection:Disconnect()
			end
			local _el_1 = el
			descendantsTracks[_el_1] = nil
		end
	end)
	onCleanup(function()
		addConnection:Disconnect()
		removeConnection:Disconnect()
		for el in children do
			removeChild(el)
		end
		table.clear(children)
	end)
	createEffect(function()
		local pred = predicate()
		if pred == nil then
			for el in children do
				removeChild(el)
			end
		else
			for el in children do
				if pred(el) ~= true then
					removeChild(el)
				end
			end
			for _, el in parent:GetDescendants() do
				if not (children[el] ~= nil) and pred(el) == true then
					addChild(el)
				end
			end
		end
	end)
end
return {
	Ref = Ref,
	Cloned = Cloned,
	findElFromParentAndPath = findElFromParentAndPath,
	RefPath = RefPath,
	ClonedPath = ClonedPath,
	RefPredicate = RefPredicate,
}
