import { Show } from "../../../flow";
import SOLID, { omitProps, splitProps } from "../../../rendering";


export function Opacity(props: { Opacity?: number } & JSX.IntrinsicElements["instFrame"] & JSX.IntrinsicElements["instCanvasGroup"]) {
  const [opacityProps, frameProps] = splitProps(omitProps(props, ["Children"]), ["Opacity"])
  return <Show When={opacityProps.Opacity !== undefined} Fallback={
    <instFrame
      {...frameProps}
      AutomaticSize={Enum.AutomaticSize.XY}
      Name={"Opacity_Fallback"}
    >
      {props.Children}
    </instFrame>
  }>
    <instCanvasGroup
      {...frameProps}
      Name={"Opacity"}
      AutomaticSize={Enum.AutomaticSize.XY}
      GroupTransparency={1 - opacityProps.Opacity!}
    >
      {props.Children}
    </instCanvasGroup>
  </Show>
}