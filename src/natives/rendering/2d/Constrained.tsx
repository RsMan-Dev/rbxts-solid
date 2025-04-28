import { Show } from "../../../flow";
import SOLID from "../../../rendering";


export function Constrained(props: {
  MinSize?: Vector2,
  MaxSize?: Vector2,
}) {
  return <Show When={props.MinSize !== undefined || props.MaxSize !== undefined}>
    <instUISizeConstraint
      {
      ...props.MinSize !== undefined && props.MaxSize !== undefined ? {
        MinSize: props.MinSize!,
        MaxSize: props.MaxSize!,
      } : props.MinSize !== undefined ? {
        MinSize: props.MinSize!,
      } : props.MaxSize !== undefined ? {
        MaxSize: props.MaxSize!,
      } : {}
      }
      Name={"Constrained"}
    />
  </Show>
}