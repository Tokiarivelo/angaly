export const PASSWORD_HASHER = Symbol('IPasswordHasher');

export interface IPasswordHasher {
  hash: (plainPassword: string) => Promise<string>;
  compare: (plainPassword: string, passwordHash: string) => Promise<boolean>;
}
