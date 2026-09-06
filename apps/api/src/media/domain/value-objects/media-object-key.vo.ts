/** Pure helper — builds a namespaced object key from a filename + a caller-supplied unique token. */
export function buildObjectKey(originalFilename: string, uniqueToken: string, keyPrefix?: string): string {
  const dotIndex = originalFilename.lastIndexOf('.');
  const extension = dotIndex > 0 ? originalFilename.slice(dotIndex + 1).toLowerCase() : 'bin';
  const prefix = keyPrefix ? `${keyPrefix}/` : '';
  return `${prefix}${uniqueToken}.${extension}`;
}
