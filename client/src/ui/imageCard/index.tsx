type ImageCardProps = {
  remove: () => void;
  mark: () => void;
  retry?: () => void;
};

const ImageCard = ({ remove, mark }: ImageCardProps) => (
  <div>
    <div>
      <span onClick={mark}>Mark</span>
      <span onClick={remove}>Delete</span>
    </div>
  </div>
);
