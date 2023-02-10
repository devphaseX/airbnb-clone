function mergeStyleClassName(className: Array<string>) {
  return className.map((name) => name.trim()).join(' ');
}

export { mergeStyleClassName };
