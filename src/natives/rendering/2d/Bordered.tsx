import { Show } from "../../../flow";
import SOLID from "../../../rendering";
import { UDimAcceptable } from "../utils/number2UDim";
import { Rounded } from "./Rounded";

export function Bordered(props: {
  BorderRadius?: UDimAcceptable,
  BorderWidth?: number,
  BorderColor?: Color3,
  BorderOpacity?: number,
}) {
  return <>
    <Show When={props.BorderRadius !== undefined}>
      <Rounded Radius={props.BorderRadius} />
    </Show>
    <instUIStroke
      ApplyStrokeMode={Enum.ApplyStrokeMode.Border}
      Thickness={props.BorderWidth ?? 0}
      Color={props.BorderColor ?? new Color3(1, 1, 1)}
      Transparency={1 - (props.BorderOpacity ?? 1)}
      Name={"Bordered"}
    />
  </>
}
