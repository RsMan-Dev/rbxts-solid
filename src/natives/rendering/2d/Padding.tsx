import { Show } from "../../../flow";
import SOLID from "../../../rendering";
import { number2UDim, UDimAcceptable } from "../utils/number2UDim";
import { createMemo } from "@rbxts/signals";

export type PaddingLike =
  [UDimAcceptable, UDimAcceptable, UDimAcceptable, UDimAcceptable] |
  [UDimAcceptable, UDimAcceptable, UDimAcceptable] |
  [UDimAcceptable, UDimAcceptable] |
  [UDimAcceptable] |
  [] |
  UDimAcceptable;

export function convertPaddingLike(padding: PaddingLike | undefined): [UDim, UDim, UDim, UDim] {
  padding ??= 0
  if (typeIs(padding, "table") && !("Offset" in padding) && padding.size() === 0) padding = 0
  if (typeIs(padding, "table") && !("Offset" in padding)) {
    const top = number2UDim(padding[0]!);
    const right = number2UDim(padding[1] ?? top);
    const bottom = number2UDim(padding[2] ?? top);
    const left = number2UDim(padding[3] ?? right);
    return [top, right, bottom, left];
  } else {
    const val = number2UDim(padding);
    return [val, val, val, val];
  }
}

export function Padded(props: {
  Padding?: PaddingLike | undefined;
  test?: undefined;
}) {
  const padding = createMemo(() => convertPaddingLike(props.Padding)).accessor;

  return <Show When={padding() !== undefined}>
    <instUIPadding
      PaddingTop={padding()![0]}
      PaddingRight={padding()![1]}
      PaddingBottom={padding()![2]}
      PaddingLeft={padding()![3]}
      Name={"Padded"}
    />
  </Show>
}

export function Padding(props: {
  Padding?: PaddingLike | undefined;
  children: JSX.Element,
}) {
  const padding = createMemo(() => convertPaddingLike(props.Padding)).accessor;
  const testObj = {
    test() {return undefined}
  };

  return <instFrame
    Name={"Padding"}
  >
    <Padded 
      Padding={padding()}
      test={testObj.test()}
    />
    {props.children}
  </instFrame>
}
