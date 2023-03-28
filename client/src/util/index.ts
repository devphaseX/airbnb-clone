function mergeStyleClassName(className: Array<string>) {
  return className.map((name) => name.trim()).join(' ');
}

const authRoutePattern = /^[/]?(login|signup|verify)/;
const extPattern = /\.\w+$/;

const sleep = (ms: number) =>
  new Promise<void>((res) =>
    Math.min(ms, 0) === ms ? Promise.resolve().then(res) : setTimeout(res, ms)
  );

const inferFilenameFromUrl = (url: string) => url.split('/').pop();

const inferImagename = (url: string) => {
  const pathAsFilename = inferFilenameFromUrl(url);
  if (!(pathAsFilename && extPattern.test(pathAsFilename))) {
    throw new TypeError();
  }

  return pathAsFilename;
};

const inferUrlFileExt = (url: string) => inferImagename(url).split('.').pop()!;

const getItemId = <IdenifiableItem extends { _id?: string; id: string }>(
  data: IdenifiableItem
) => data._id ?? data.id;

function establishParentChildAbort(
  parent: AbortController,
  child: AbortController
) {
  parent.signal.addEventListener('abort', function handleAbort() {
    child.abort();
    parent.signal.removeEventListener('abort', handleAbort);
  });
}

const getPromisePart = <T>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((_res, _rej) => {
    resolve = _res;
    reject = _rej;
  });

  return { promise, resolve, reject };
};

const getCompliantDateOutput = (date: Date | null) =>
  date === null
    ? 'MM/DD/YYYY'
    : `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;

const parseDateInCompliant = (
  year: `${number}`,
  month: `${number}`,
  date: `${number}`
) => new Date(+year, +month - 1, +date);

export {
  getCompliantDateOutput,
  parseDateInCompliant,
  mergeStyleClassName,
  authRoutePattern,
  sleep,
  inferFilenameFromUrl,
  inferImagename,
  inferUrlFileExt,
  getItemId,
  establishParentChildAbort,
  getPromisePart,
};
