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
      ...rest
    },
    ref
  ) => {
    if (type === 'lock' && typeof (value ?? defaultValue) === 'undefined') {
      throw new TypeError(
        'Lock input must provide either a value or defaultValue'
      );
    }
    const formID = useId().replace(/\W/g, '');
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
          {...rest}
          ref={ref}
        />
        {Icon && <Icon />}
      </label>
    );
  }
);

export { TagInput };
