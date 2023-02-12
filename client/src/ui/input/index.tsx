import { UseFormProps } from 'react-hook-form';
import { forwardRef } from 'react';
import { LegacyRef } from 'react';
import { useId } from 'react';
import { useRef } from 'react';
import { useLocation, useParams } from 'react-router-dom';

type InputProps = {
  type: React.HTMLInputTypeAttribute;
  label: string;
  placeholder?: string;
  inputClass?: string;
  labelClass?: string;
  defaultValue?: string;
  disabled?: boolean;
  value?: string;
  onInputFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onInputBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
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
    value,
    onInputFocus,
    onInputBlur,
    ...rest
  }: InputProps,
  ref?: LegacyRef<HTMLInputElement>
) => {
  const formID = useId();
  const inputRef = ref || useRef<HTMLInputElement | null>(null);
  const labelRef = useRef<HTMLLabelElement | null>(null);

  return (
    <label
      className="input-wrapper"
      id={formID}
      style={{ display: 'block' }}
      ref={labelRef}
      {...{ 'aria-disabled': rest.disabled ?? undefined }}
    >
      <input
        type={type}
        placeholder={placeholder}
        className={inputClass}
        {...rest}
        ref={inputRef}
        defaultValue={defaultValue}
        id={formID}
        onFocus={(event) => {
          labelRef.current && labelRef.current.toggleAttribute('focused', true);
          onInputFocus?.(event);
        }}
        onBlur={(event) => {
          labelRef.current &&
            labelRef.current.toggleAttribute('focused', false);
          onInputBlur?.(event);
        }}
      />
      <p className={labelClass}>{label}</p>
      {Icon && <Icon />}
    </label>
  );
};

const Input = forwardRef<HTMLInputElement, InputProps>(_Input);

export { Input };
