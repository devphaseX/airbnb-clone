import { Link, LinkProps, useNavigate } from 'react-router-dom';
import { useBlockLink } from './lock';

interface BlockableLinkProps extends LinkProps {}

const BlockableLink: React.FC<BlockableLinkProps> = ({ children, ...rest }) => {
  const [getBlockStatus, { requestUnBlock }] = useBlockLink();
  const navigate = useNavigate();
  return (
    <div
      onClickCapture={(event) => {
        if (getBlockStatus()) {
          event.stopPropagation();

          requestUnBlock(() => {
            navigate(rest.to, {
              relative: rest.relative,
              replace: rest.replace,
              state: rest.state,
              preventScrollReset: rest.preventScrollReset,
            });
          });

          event.preventDefault();
        }
      }}
    >
      <Link {...rest}>{children}</Link>
    </div>
  );
};

export { BlockableLink };
