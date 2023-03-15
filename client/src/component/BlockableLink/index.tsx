import { Link, LinkProps, useNavigate } from 'react-router-dom';
import { useBlockLink } from '../../hooks/useBlockLink';

interface BlockableLinkProps extends LinkProps {}

const BlockableLink: React.FC<BlockableLinkProps> = ({ children, ...rest }) => {
  const [getBlockStatus, { requestUnBlock }] = useBlockLink();
  const navigate = useNavigate();
  return (
    <div
      onClickCapture={(event) => {
        if (getBlockStatus()) {
          event.stopPropagation();
          if (event.cancelable && !event.defaultPrevented) {
            event.preventDefault();
          }

          requestUnBlock(() => {
            navigate(rest.to, {
              relative: rest.relative,
              replace: rest.replace,
              state: rest.state,
              preventScrollReset: rest.preventScrollReset,
            });
          });
        }
      }}
    >
      <Link {...rest}>{children}</Link>
    </div>
  );
};

export { BlockableLink };
