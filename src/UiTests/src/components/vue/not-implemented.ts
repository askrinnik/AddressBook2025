/*
 * Placeholder for a Vue component-object member whose Vuetify markup is not covered yet. A spec
 * that reaches such a member fails with a message naming it, instead of a timeout on a wrong
 * locator.
 */
export function notImplemented(className: string, member: string): never {
  throw new Error(`${className}.${member} is not implemented for the vue frontend`);
}
