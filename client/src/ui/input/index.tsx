import {
  useId,
  useRef,
  useLayoutEffect,
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
  containerRef?: Ref<HTMLDivElement>;
  onContainerClick?: () => void;
}

const TagInput = forwardRef<HTMLInputElement, InputProps>(
  (
    {
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
      Icon,
      placeholder,
      ...rest
    },
    ref
  ) => {
    if (
      typeof placeholder === 'undefined' &&
      type === 'lock' &&
      typeof (value ?? defaultValue) === 'undefined'
    ) {
      throw new TypeError(
        'Lock input must provide either a placeholder, value or defaultValue'
      );
    }
    const formID = useId().replace(/\W/g, '');
    const tagLabelRef = useRef<HTMLParagraphElement | null>(null);

    useLayoutEffect(() => {
      const tagLabelEl = tagLabelRef.current;
      if (typeof forceLabelShow === 'undefined' || !tagLabelEl) return;
      tagLabelEl.toggleAttribute('persist', forceLabelShow);
    }, [forceLabelShow]);

    const choosenValue = value ?? defaultValue;
    return (
      <div
        className={mergeStyleClassName(['tag-input', containerClass ?? ''])}
        onClick={onContainerClick}
        // htmlFor={formID}
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
          value={
            choosenValue ? choosenValue : type === 'lock' ? placeholder : ''
          }
          className={mergeStyleClassName([inputClass ?? ''])}
          placeholder={placeholder}
          {...rest}
          ref={ref}
        />
        {Icon && <Icon />}
      </div>
    );
  }
);

export { TagInput };
