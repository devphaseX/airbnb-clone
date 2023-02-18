import { useState } from 'react';
import { Link } from 'react-router-dom';
import './style.css';
import { mergeStyleClassName } from '../../util';
import { expandedFooterLink } from './links';
import { World } from '../../ui/icon/world';
import cancelIcon from '../../assets/cancel.svg';

const Footer = () => {
  const [collapse, setCollapse] = useState(true);

  return (
    <footer className="footer">
      <FooterCollapse setCollapse={setCollapse} collapse={collapse} />
      <FooterExpanded setCollapse={setCollapse} collapse={collapse} />
    </footer>
  );
};

type FooterCollapseProps = {} & Collapse;
const FooterCollapse = ({ setCollapse }: FooterCollapseProps) => (
  <div className={'footer__collapse'}>
    <div className="footer__collapse-wrapper  section-wrapper">
      <div className="footer__links-wrapper">
        <p className="footer__copy">
          &copy; {new Date().getFullYear()} Airbnb, Inc
        </p>
        <nav>
          <ul className="footer__links">
            <li>Privacy</li>
            <li>Terms</li>
            <li>Sitemap</li>
            <li>Destinations</li>
          </ul>
        </nav>
      </div>
      <div className="footer__links footer__links-support">
        <div>
          <ul className="footer__links">
            <li>
              <span>{<World />}</span>
              <span>English(US)</span>
            </li>
            <li>
              <span>$</span>
              <span>USD</span>
            </li>
            <li>Support & resources</li>
          </ul>
        </div>
        <span onClick={() => setCollapse(false)} className="expand__icon">
          <svg
            viewBox="0 0 32 32"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            role="presentation"
            focusable="false"
            style={{
              display: 'block',
              fill: 'none',
              height: '16px',
              width: '16px',
              stroke: 'currentcolor',
              strokeWidth: 4,
              overflow: 'visible',
            }}
          >
            <g fill="none">
              <path d="m4 20 11.2928932-11.29289322c.3905243-.39052429 1.0236893-.39052429 1.4142136 0l11.2928932 11.29289322"></path>
            </g>
          </svg>
        </span>
      </div>
    </div>
  </div>
);

type Collapse = {
  setCollapse: (collapse: boolean) => void;
  collapse: boolean;
};

type FooterExpandedProps = {} & Collapse;
const FooterExpanded = ({ setCollapse, collapse }: FooterExpandedProps) => (
  <>
    <div
      className={mergeStyleClassName([
        'footer__expand',
        collapse ? 'footer__expand--hide' : 'footer__expand--show',
      ])}
    >
      <span className="cancel-button" onClick={() => setCollapse(true)}>
        <img src={cancelIcon} alt="cancel icon button" />
      </span>
      <div className="footer__expand-wrapper section-wrapper">
        <div className="nav__expand-wrapper">
          {Object.keys(expandedFooterLink).map((key, i) => (
            <div key={`${key}-${i}`}>
              <h4 className="footer__link-title">{key}</h4>
              <nav className="footer__expand-links">
                <ul>
                  {expandedFooterLink[key].map((linkType, i) => (
                    <li key={`${linkType.name}-${i}`}>
                      {linkType.ref === '_blank' ? (
                        <p>{linkType.name}</p>
                      ) : linkType.ref === 'external' ? (
                        <a href={linkType.ref} target="_blank">
                          {linkType.name}
                        </a>
                      ) : (
                        <Link to={linkType.path}>{linkType.name}</Link>
                      )}
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          ))}
        </div>
      </div>
    </div>
    <div className="footer__backdrop" onClick={() => setCollapse(true)}></div>
  </>
);
export { Footer };
