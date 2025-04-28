import { createEffect, createMemo } from "@rbxts/signals";
import SOLID from "../../../rendering";

export function ScrollView(props: {
  Direction?: "x" | "y" | "xy" | "none" | undefined,
  MaxSize?: Vector2 | undefined,
  Children: JSX.Element,
  ScrollBarThickness?: number,
}) {
  let sref!: ScrollingFrame, ref!: Frame, maxSize = props.MaxSize
  createEffect(() => maxSize = props.MaxSize) // extracts all signals for optimization reasons
  const scrollBarThickness = createMemo(() => props.ScrollBarThickness ?? 4).accessor
  const scrollPadding = () => scrollBarThickness() + 1

  return <instFrame
    Name={"ScrollView_Constraints"}
    Ref={r => ref = r}
    Transparency={1}
    Size={new UDim2(1, 0, 1, 0)}
  >
    <instScrollingFrame
      Ref={r => sref = r}
      Name={"ScrollView_ScrollingFrame"}
      Transparency={1}
      Size={new UDim2(1, 0, 1, 0)}
      ScrollingEnabled={props.Direction !== "none"}
      CanvasSize={new UDim2(1, -scrollPadding(), 1, -scrollPadding())}
      ScrollBarThickness={scrollBarThickness()}
      VerticalScrollBarInset={Enum.ScrollBarInset.ScrollBar}
      HorizontalScrollBarInset={Enum.ScrollBarInset.ScrollBar}
      BorderSizePixel={0}
      ScrollingDirection={props.Direction === "x" ? Enum.ScrollingDirection.X : props.Direction === "y" ? Enum.ScrollingDirection.Y : Enum.ScrollingDirection.XY}
      AutomaticCanvasSize={Enum.AutomaticSize.XY}
    >
      <instFrame
        Name={"ScrollView_Content_Updater"}
        AutomaticSize={Enum.AutomaticSize.XY}
        Transparency={1}
        on:GetPropertyChangedSignal={["AbsoluteSize", (inst) => {
          const size = inst.AbsoluteSize.add(new Vector2(scrollPadding() + 3, scrollPadding() + 3));
          ref.Size = new UDim2(
            0, maxSize !== undefined && maxSize.X < size.X ? maxSize.X : size.X,
            0, maxSize !== undefined && maxSize.Y < size.Y ? maxSize.Y : size.Y,
          )
        }]}
      >
        {props.Children}
      </instFrame>
    </instScrollingFrame>
  </instFrame>
}