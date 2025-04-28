

export type UDimAcceptable = UDim | number

export function number2UDim(value: number | UDim): UDim {
  if (typeIs(value, "number")) return new UDim(0, value);
  else return value;
}