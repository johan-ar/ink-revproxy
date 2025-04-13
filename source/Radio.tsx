import React, { SetStateAction, useCallback, useState } from "react";
import Text, { TextProps } from "./util/Text.js";

type CheckboxProps = TextProps & {
  checked?: boolean;
  disabled?: boolean;
};

const Radio: React.FC<CheckboxProps> = ({
  checked,
  children,
  disabled,
  color,
  ...props
}) => {
  return (
    <Text {...props} color={disabled ? "gray" : color}>
      {checked ? "\udb81\udf65" : "\udb81\udf66"}
      {children}
    </Text>
  );
};

export default Radio;

export function useToggle(initialState: boolean | (() => boolean) = false) {
  const [checked, setChecked] = useState(initialState);

  const toggle = useCallback(
    (value?: SetStateAction<boolean>) => {
      if (value === undefined) setChecked((value) => !value);
      else setChecked(value);
    },
    [setChecked]
  );

  return [checked, toggle] as const;
}
