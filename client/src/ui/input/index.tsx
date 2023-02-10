import { UseFormProps } from 'react-hook-form';
import { forwardRef } from 'react';
import { LegacyRef } from 'react';

type InputProps = {
  type: React.HTMLInputTypeAttribute;
  label: string;
  placeholder?: string;
  inputClass?: string;
  labelClass?: string;
  defaultValue?: string;
  Icon?: () => React.ReactElement;
} & UseFormProps;

const _Input = (
  {
    type,
    label,
    placeholder,
    inputClass,
    labelClass,
    Icon,
    defaultValue,
    ...rest
  }: InputProps,
  ref?: LegacyRef<HTMLInputElement>
) => (
  <div className="input-wrapper">
    <input
      type={type}
      placeholder={placeholder}
      className={inputClass}
      {...rest}
      ref={ref}
      defaultValue={defaultValue}
    />
    <p className={labelClass}>{label}</p>
    {Icon && <Icon />}
  </div>
);

const Input = forwardRef<HTMLInputElement, InputProps>(_Input);

export { Input };
