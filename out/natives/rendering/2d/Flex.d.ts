import { UDimAcceptable } from "../utils/number2UDim";
export type FlexDirection = "horizontal" | "vertical";
export type FlexAlignment = "start" | "center" | "end";
export type CrossAxisAlignment = FlexAlignment | "stretch";
export type MainAxisAlignment = FlexAlignment | "space-between" | "space-around" | "space-evenly" | "stretch";
export declare function Flexible(props: {
    Direction?: FlexDirection;
    MainAxisAlignment?: MainAxisAlignment;
    CrossAxisAlignment?: CrossAxisAlignment;
    Gap?: UDimAcceptable;
}): JSX.Element;
export declare function Flex(props: Parameters<typeof Flexible>[0] & JSX.IntrinsicElements["instFrame"]): JSX.Element;
