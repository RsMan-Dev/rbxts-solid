import { createMemo } from "@rbxts/signals";
import SOLID, { omitProps, splitProps } from "../../../rendering";
import number2UDim, { UDimAcceptable } from "../utils/number2UDim";

export type FlexDirection = "horizontal" | "vertical";
export type FlexAlignment = "start" | "center" | "end";
export type CrossAxisAlignment = FlexAlignment | "stretch";
export type MainAxisAlignment = FlexAlignment | "space-between" | "space-around" | "space-evenly" | "stretch";
type directionalFlexData = { HorizontalAlignment: Enum.HorizontalAlignment, HorizontalFlex: Enum.UIFlexAlignment } |
{ VerticalAlignment: Enum.VerticalAlignment, VerticalFlex: Enum.UIFlexAlignment }

function align(horizontal: boolean, alignment?: CrossAxisAlignment | MainAxisAlignment): Enum.HorizontalAlignment | Enum.VerticalAlignment {
  switch (alignment) {
    case "start": return horizontal ? Enum.HorizontalAlignment.Left : Enum.VerticalAlignment.Top;
    case "center": return horizontal ? Enum.HorizontalAlignment.Center : Enum.VerticalAlignment.Center;
    case "end": return horizontal ? Enum.HorizontalAlignment.Right : Enum.VerticalAlignment.Bottom;
    default: return horizontal ? Enum.HorizontalAlignment.Left : Enum.VerticalAlignment.Top;
  }
}

function flexAlign(alignment?: CrossAxisAlignment | MainAxisAlignment): Enum.UIFlexAlignment {
  switch (alignment) {
    case "space-between": return Enum.UIFlexAlignment.SpaceBetween;
    case "space-around": return Enum.UIFlexAlignment.SpaceAround;
    case "space-evenly": return Enum.UIFlexAlignment.SpaceEvenly;
    case "stretch": return Enum.UIFlexAlignment.Fill;
    default: return Enum.UIFlexAlignment.None;
  }
}

function listAlign(alignment?: CrossAxisAlignment | MainAxisAlignment): Enum.ItemLineAlignment {
  switch (alignment) {
    case "start": return Enum.ItemLineAlignment.Start;
    case "center": return Enum.ItemLineAlignment.Center;
    case "end": return Enum.ItemLineAlignment.End;
    case "stretch": return Enum.ItemLineAlignment.Stretch;
    default: return Enum.ItemLineAlignment.Stretch;
  }
}


export function Flexible(
  props: {
    Direction?: FlexDirection;
    MainAxisAlignment?: MainAxisAlignment;
    CrossAxisAlignment?: CrossAxisAlignment;
    Gap?: UDimAcceptable;
  }
) {
  const mainAxisAlignment = createMemo(() => {
    const direction = props.Direction ?? "horizontal", horizontal = direction === "horizontal";
    return {
      [horizontal ? "HorizontalAlignment" : "VerticalAlignment"]: align(horizontal, props.MainAxisAlignment),
      [horizontal ? "HorizontalFlex" : "VerticalFlex"]: flexAlign(props.MainAxisAlignment),
    } as directionalFlexData;
  }).accessor;

  const crossAxisAlignment = createMemo(() => {
    const direction = props.Direction ?? "horizontal", horizontal = direction !== "horizontal";
    return {
      [horizontal ? "HorizontalAlignment" : "VerticalAlignment"]: align(horizontal, props.CrossAxisAlignment),
      [horizontal ? "HorizontalFlex" : "VerticalFlex"]: flexAlign(props.CrossAxisAlignment),
    } as directionalFlexData;
  }).accessor;

  const fillDirection = createMemo(() => props.Direction === "vertical" ? Enum.FillDirection.Vertical : Enum.FillDirection.Horizontal);

  return <instUIListLayout
    FillDirection={fillDirection()}
    {...mainAxisAlignment()}
    {...crossAxisAlignment()}
    ItemLineAlignment={listAlign(props.CrossAxisAlignment)}
    Padding={props.Gap !== undefined ? number2UDim(props.Gap) : new UDim(0, 0)}
    SortOrder={Enum.SortOrder.LayoutOrder}
    Name={"Flexible"}
  />
}

export function Flex(props: Parameters<typeof Flexible>[0] & JSX.IntrinsicElements["instFrame"]) {
  const [flexibleProps, frameProps] = splitProps(omitProps(props, ["Children"]), ["Direction", "MainAxisAlignment", "CrossAxisAlignment", "Gap"])
  return <instFrame
    {...frameProps}
    Name={"Flex"}
    Size={new UDim2(0, 0, 0, 0)}
    BackgroundTransparency={props.BackgroundColor3 !== undefined ? 0 : 1}
    BorderSizePixel={props.BorderColor3 !== undefined ? 1 : 0}
    AutomaticSize={Enum.AutomaticSize.XY}
  >
    <Flexible {...flexibleProps}/>
    {props.Children}
  </instFrame>
}