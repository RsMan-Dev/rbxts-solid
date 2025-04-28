# @rbxts/solid

[![npm version](https://img.shields.io/npm/v/@rbxts/solid)](https://www.npmjs.com/package/@rbxts/solid)
[![GitHub license](https://img.shields.io/github/license/RsMan-Dev/rbxts-solid)](https://github.com/RsMan-Dev/rbxts-solid/blob/main/LICENSE)

A powerful reactive UI library for Roblox TypeScript projects, inspired by SolidJS. This library provides an efficient way to create reactive user interfaces in your Roblox games using JSX syntax and reactive primitives.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
  - [JSX Elements](#jsx-elements)
  - [Components](#components)
  - [Control Flow](#control-flow)
  - [Props Utilities](#props-utilities)
- [API Reference](#api-reference)
- [Performance Tips](#performance-tips)

## Installation

Currently available through GitHub:

```bash
npm install @rbxts/solid@github:RsMan-Dev/rbxts-solid
```

> Note: NPM package coming soon!

## Quick Start

```typescript
import { createSignal, createRoot } from "@rbxts/signals";
import SOLID, { InstanceContext, getInstance } from "@rbxts/solid";

function Counter() {
  const count = createSignal(0);
  
  return (
    <instFrame Size={new UDim2(0, 200, 0, 100)}>
      <instTextLabel
        Text={count()}
        Size={new UDim2(1, 0, 1, 0)}
        TextSize={24}
      />
      <instTextButton
        Text="Increment"
        Size={new UDim2(0, 100, 0, 30)}
        Position={new UDim2(0.5, -50, 0.5, -15)}
        on:MouseButton1Click={() => {
          count.set(v => v+1)
          print(getInstance(), "clicked")
        }}
      />
    </instFrame>
  );
}

// Create the UI
createRoot(() => {
  InstanceContext.populate(game.GetService("Players").LocalPlayer.WaitForChild("PlayerGui"));
  return <Counter />;
});
```

## Core Concepts

### JSX Elements

The library supports creating Roblox instances using JSX syntax. All Roblox instance types are available with the `inst` prefix.

Instance props have special prefixes for different functionalities:

- **Events**: Prefixed with `on:`, `once:`, `parallel:`
  - `on:MouseButton1Click`: Regular event
  - `once:MouseButton1Click`: One-time event
  - `parallel:MouseButton1Click`: Parallel event
  - Current instance can be accessed using `getInstance()`

- **Functions**: Prefixed with `fn:`
  - `fn:AddTag`: Can take array of arguments or function
  - Function receives instance's method as first argument

- **Getters/Setters**: Prefixed with `get:` and `set:`
  - `get:Name`, `set:Name`
  - Can provide array of arguments or function

```tsx
<instFrame Size={new UDim2(0, 200, 0, 100)}>
  <instTextLabel 
    Text="Hello World"
    on:MouseButton1Click={() => print(getInstance(), "clicked")}
    once:MouseButton1Click={() => print(getInstance(), "clicked once")}
    parallel:MouseButton1Click={() => print(getInstance(), "clicked parallel")}
    fn:AddTag={["test"]}
    fn:AddTag={(addTag) => (addTag("test"), addTag("test2"))}
    set:Attribute={["test", 1]}
    set:Attribute={(setAttribute) => (setAttribute("test", 2), setAttribute("test2", 3))}
    get:Attribute={getter => print(getter("test"))}
    get:Attributes={getter => print(getter())}
  />
</instFrame>
```

### Components

Components are functions that return JSX elements. They can be reactive and update when their dependencies change.

JSX props in function components are proxied using [@rbxts/jsnatives](https://github.com/RsMan-Dev/rbxts-jsnatives) to maintain reactivity.

> ⚠️ Warning: Never destructure props in function components, as they are proxied to maintain reactivity.

```typescript
function Greeting(props: { name: string }) {
  return <instTextLabel Text={`Hello, ${props.name}!`} />;
}
```

### Control Flow

The library provides several control flow components:

#### Show

Conditionally render content:

```typescript
<Show When={isVisible()} Fallback={<instTextLabel Text="Loading..." />}>
  <instTextLabel Text="Content is visible!" />
</Show>
```

#### FastFor

Efficiently render lists of items. Uses value references to index roots created, so duplicate references are not possible.

```typescript
<FastFor Each={items()} Fallback={<instTextLabel Text="No items" />}>
  {(item, index) => (
    <instTextLabel Text={`Item ${index()}: ${item}`} />
  )}
</FastFor>
```

### Props Utilities

The library provides several utilities for working with props. All utilities are proxied and require avoiding destructuring to maintain reactivity.

> ⚠️ Warning: Looping into props needs to use Object.* methods, as they are proxied and will fail if using pairs or ipairs.

- `mergeProps`: Merge multiple props objects
  - Special case: functions act as getters
  - To return a function, use `attr: () => functionValue`
- `pickProps`: Create a new object with only specified props
- `omitProps`: Create a new object without specified props
- `splitProps`: Split props into two objects based on keys

## Performance Tips

1. Use `FastFor` instead of regular `For` when you don't need duplicate items (For not implemented yet)
2. Use `Show` for conditional rendering
3. Keep components small and focused
4. Don't hesitate to memoize expensive computations, or computations that run often, as it's cached to avoid unnecessary effect triggers
5. Use `untrack` when you don't need reactivity
6. Use batch in events to avoid unnecessary effect triggers

# [ DOC WIP ... ]
look at the code directly if you want more infos

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## Acknowledgments

This library was inspired by:
- [SolidJS](https://github.com/solidjs/solid)
- [@rbxts/signals](https://github.com/RsMan-Dev/rbxts-signals)
- [@rbxts/jsnatives](https://github.com/RsMan-Dev/rbxts-jsnatives)
