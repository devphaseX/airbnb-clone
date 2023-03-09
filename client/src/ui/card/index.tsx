import { Link } from 'react-router-dom';
import { ServerAccomodationData } from '../../component/userPlace/form';
import { getItemId } from '../../util';
import './style.css';

type CardProps = Required<
  Pick<
    ServerAccomodationData,
    'photoTag' | 'title' | 'address' | 'description' | 'price'
  >
> & { id: string; _id?: string };

const Card = (props: CardProps) => {
  const { title, address, photoTag, description, price } = props;
  return (
    <Link to={`/place/${getItemId(props)}`}>
      <div className="card">
        <div className="card__img">
          <img src={photoTag.imgUrlPath} alt={title} />
        </div>
        <div className="card__content">
          <h2 className="card__address">{address}</h2>
          <h3 className="card__description">{description}</h3>
        </div>
        <div className="card__price">${price} per night</div>
      </div>
    </Link>
  );
};

export { Card };
