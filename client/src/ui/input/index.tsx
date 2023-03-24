import {
  useId,
  useRef,
  useLayoutEffect,
  ForwardRefRenderFunction,
  forwardRef,
  type FC,
  type Ref,
} from 'react';
import './style.css';
import { mergeStyleClassName } from '../../util';

interface InputProps
  extends React.DetailedHTMLProps<
    React.InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  > {
  type: React.HTMLInputTypeAttribute | 'lock' | undefined;
  label: string;
  inputClass?: string;
  containerClass?: string;
  placeholder?: string;
  Icon?: () => React.ReactElement;
  labelClass?: string;
  forceLabelShow?: boolean;
  containerRef?: Ref<HTMLLabelElement>;
  onContainerClick?: () => void;
}

const TagInput: FC<InputProps> = ({
  type,
  label,
  value,
  defaultValue,
  onContainerClick,
  onClick,
  forceLabelShow,
  labelClass,
  inputClass,
  containerClass,
  containerRef,
}) => {
  if (type === 'lock' && typeof (value ?? defaultValue) === 'undefined') {
    throw new TypeError(
      'Lock input must provide either a value or defaultValue'
    );
  }
  const formID = useId();
  const tagLabelRef = useRef<HTMLParagraphElement | null>(null);

  useLayoutEffect(() => {
    const tagLabelEl = tagLabelRef.current;
    if (typeof forceLabelShow === 'undefined' || !tagLabelEl) return;
    tagLabelEl.toggleAttribute('persist', forceLabelShow);
  }, [forceLabelShow]);

  return (
    <label
      className={mergeStyleClassName(['tag-input', containerClass ?? ''])}
      onClick={onContainerClick}
      htmlFor={formID}
      key={formID}
      ref={containerRef}
    >
      <p
        className={mergeStyleClassName(['tag-input__type', labelClass ?? ''])}
        ref={tagLabelRef}
      >
        {label}
      </p>

      <input
        type={type === 'lock' ? 'button' : type}
        id={formID}
        onClick={onClick}
        value={value ?? defaultValue}
        className={mergeStyleClassName([inputClass ?? ''])}
      />
    </label>
  );
};

const _Input: ForwardRefRenderFunction<HTMLInputElement, InputProps> = (
  props,
  ref?: Ref<HTMLInputElement>
) => {
  const {
    type,
    label,
    inputClass,
    placeholder,
    defaultValue,
    disabled,
    onFocus,
    onBlur,
    labelClass,
    Icon,
    forceLabelShow,
    ...rest
  } = props;
  const formID = useId();
  const inputRef =
    (typeof ref === 'object' && ref) || useRef<HTMLInputElement | null>(null);
  const labelRef = useRef<HTMLLabelElement | null>(null);

  useLayoutEffect(() => {
    if (inputRef && typeof forceLabelShow !== 'undefined') {
      inputRef.current?.toggleAttribute('forceFocus', forceLabelShow);
    }
  }, [forceLabelShow]);

  return (
    <label
      className="input-wrapper"
      id={formID}
      style={{ display: 'block' }}
      ref={labelRef}
      {...{ 'aria-disabled': disabled ?? undefined }}
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
          onFocus?.(event);
        }}
        onBlur={(event) => {
          labelRef.current &&
            labelRef.current.toggleAttribute('focused', false);
          onBlur?.(event);
        }}
      />
      <p className={labelClass}>{label}</p>
      {Icon && <Icon />}
    </label>
  );
};

const Input = forwardRef<HTMLInputElement, InputProps>(_Input);

export { Input, TagInput as CustomInput };
