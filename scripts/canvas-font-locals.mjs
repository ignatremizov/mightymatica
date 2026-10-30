/** FFDec font helpers rely on sloppy-script globals; ES modules must not. */
export function localizeFontFill(source) {
  return source.replace(
    /(function font\d+\(ctx,ch,textColor\)\s*\{\r?\n[ \t]*)defaultFill = textColor;/g,
    "$1var defaultFill = textColor;",
  );
}
