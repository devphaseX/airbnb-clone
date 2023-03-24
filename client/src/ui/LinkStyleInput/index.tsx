import { FC } from 'react';
import './style.css';

interface LinkStyleInput {
  childrens: React.ReactNode;
}

const LinkStyleInput: FC<LinkStyleInput> = ({ childrens }) => (
  <div className="link-style-input">{childrens}</div>
);
export { LinkStyleInput };
