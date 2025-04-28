import { UDimAcceptable } from "../utils/number2UDim";
export type PaddingLike = [
    UDimAcceptable,
    UDimAcceptable,
    UDimAcceptable,
    UDimAcceptable
] | [
    UDimAcceptable,
    UDimAcceptable,
    UDimAcceptable
] | [
    UDimAcceptable,
    UDimAcceptable
] | [
    UDimAcceptable
] | [
] | UDimAcceptable;
export declare function convertPaddingLike(padding: PaddingLike | undefined): [
    UDim,
    UDim,
    UDim,
    UDim
];
export declare function Padded(props: {
    Padding?: PaddingLike | undefined;
    test?: undefined;
}): JSX.Element;
export declare function Padding(props: {
    Padding?: PaddingLike | undefined;
    children: JSX.Element;
}): JSX.Element;
