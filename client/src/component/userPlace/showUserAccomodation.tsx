import {
  Link,
  LoaderFunctionArgs,
  redirect,
  useOutletContext,
} from 'react-router-dom';
import { usePlacesQuery } from '../../store/query/places';
import { ServerAccomodationData } from './form';
import { getItemId } from '../../util';
import { AccountOutletContext } from '../../pages';
import { fetchFn } from '../../store/api/baseUrl';
import './style.user.place.css';

const ShowUserAccomodation = () => {
  const { data } = usePlacesQuery({ withCredentials: true });

  return (
    <div className="show-place">
      {(data ?? []).map((item) => (
        <UserAccomodationItem key={getItemId(item)} item={item} />
      ))}
    </div>
  );
};

type UserAccomodationItemProps = { item: ServerAccomodationData };
const UserAccomodationItem = ({ item }: UserAccomodationItemProps) => {
  const { photoTag, description, title } = item;

  const { basePath, beforeNowPath } = useOutletContext<AccountOutletContext>();

  return (
    <Link
      className="user-place"
      to={`/${basePath}/${beforeNowPath}/${getItemId(item)}`}
    >
      <div className="user-place__img">
        <img src={photoTag.imgUrlPath} alt="accomodation place image" />
      </div>
      <div className="user-place__content">
        <h4>{title}</h4>
        <p>{description}</p>
      </div>
    </Link>
  );
};

async function userAccomodationLoader({ params, request }: LoaderFunctionArgs) {
  try {
    const response = await fetchFn((baseUrl) =>
      fetch(`${baseUrl}/place/user/${params.placeId}`, {
        credentials: 'include',
        signal: request.signal,
      })
    )();

    if (response.ok) {
      return await response.json();
    }
    throw await response.json();
  } catch (e) {
    if (request.signal.aborted) {
      return redirect('/account/places');
    }
  }
  return null;
}
export { ShowUserAccomodation, userAccomodationLoader };
