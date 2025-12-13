import { AmountInput } from "./AmountInput";

interface AmountInputWithKeypadProps {
  value: string;
  onPress: () => void;
  error?: boolean;
  placeholder?: string;
}

export const AmountInputWithKeypad = ({
  value,
  onPress,
  error,
  placeholder,
}: AmountInputWithKeypadProps) => {
  return (
    <AmountInput
      value={value}
      onPress={onPress}
      error={error}
      placeholder={placeholder}
    />
  );
};

