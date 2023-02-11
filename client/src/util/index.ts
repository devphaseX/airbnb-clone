function mergeStyleClassName(className: Array<string>) {
  return className.map((name) => name.trim()).join(' ');
}

const authRoutePattern = /^[/]?(login|signup)/;

export { mergeStyleClassName, authRoutePattern };
