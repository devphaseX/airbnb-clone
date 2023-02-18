import './style.css';
import { mergeStyleClassName } from '../../util';

type BackdropProps = { classNames?: string[]; onClick: () => void };
const Backdrop = ({ classNames, onClick }: BackdropProps) => (
  <div
    className={mergeStyleClassName(['backdrop', ...(classNames ?? [])])}
    onClick={onClick}
  ></div>
);

export { Backdrop };
