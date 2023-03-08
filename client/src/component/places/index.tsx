import { usePlacesQuery } from '../../store/query/places';
import { Card } from '../../ui/card';
import { getItemId } from '../../util';
import './style.css';

const Place = () => {
  const { isLoading, data } = usePlacesQuery();

  let content: React.ReactNode;
  if (isLoading) content = <div>Loading...</div>;

  if (data && !isLoading) {
    content = Array.from({ length: 24 }, (_, i) =>
      data.map((item) => (
        <Card
          {...(item as Required<typeof item>)}
          key={getItemId(item).concat(i.toString())}
        />
      ))
    ).flat();
  }
  return <div className="place-list">{content}</div>;
};

export { Place };
