import { UDimAcceptable } from "../utils/number2UDim";
import SOLID from "../../../rendering";
import number2UDim from "../utils/number2UDim";


export function Rounded(props: {
  Radius?: UDimAcceptable,
}) {
  return <instUICorner CornerRadius={number2UDim(props.Radius ?? 0)} Name={"Rounded"}/>
}
