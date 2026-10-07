export const SECRET_CIPHER = 'ISecretCipher';

export interface ISecretCipher {
  encrypt(plainText: string): Promise<string>;
  decrypt(cipherText: string): Promise<string>;
}
