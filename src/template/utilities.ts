/**
 * Stringifies a constant variable that contains an array.
 * @param constantName The name of the constant variable
 * @param elements The elements of the array
 * @returns The stringified constant variable
 */
export const stringifyArrayConstant = (constantName: string, elements: string[]): string => {
  let variable: string = `const ${constantName} = [\n`;
  variable += elements.reduce(
    (prev, current, index) => `${prev}  '${current}'${index < elements.length - 1 ? ',\n' : ','}`,
    '',
  );
  variable += '\n];';
  return variable;
};
