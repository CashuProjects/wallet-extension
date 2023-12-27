import { Token, TokenEntry, Proof } from '@cashu/cashu-ts';
import { argon2id, argon2Verify } from 'hash-wasm';
import {getStorageItem, setStorageItem} from './storage';

export function generateRandomString(length: number) {
	let result = '';
	const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	const charactersLength = characters.length;
	for (let i = 0; i < length; i++) {
		result += characters.charAt(Math.floor((Date.now() * Math.random()) % charactersLength));
	}
	return result;
}

export function sortProofsById(proofs: Array<Proof>) {
	return proofs.sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * imported from @cashu-ts
 * merge proofs from same mint,
 * removes TokenEntrys with no proofs or no mint field
 * and sorts proofs by id
 *
 * @export
 * @param {Token} token
 * @return {*}  {Token}
 */
export function cleanToken(token: Token): Token {
	const tokenEntryMap: { [key: string]: TokenEntry } = {};
	for (const tokenEntry of token.token) {
		if (!tokenEntry?.proofs?.length || !tokenEntry?.mint) {
			continue;
		}
		if (tokenEntryMap[tokenEntry.mint]) {
			tokenEntryMap[tokenEntry.mint].proofs.push(...[...tokenEntry.proofs]);
			continue;
		}
		tokenEntryMap[tokenEntry.mint] = { mint: tokenEntry.mint, proofs: [...tokenEntry.proofs] };
	}
	return {
		memo: token?.memo,
		token: Object.values(tokenEntryMap).map(x => ({ ...x, proofs: sortProofsById(x.proofs) }))
	};
}

export async function encryptData(data: unknown, password: string): string {
  const setting = getStorageItem('setting');
  return await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: setting.iv },
    password,
    JSON.stringify(data),
  );
}

export async function decryptData(cipher: string, password: string) {
  const setting = getStorageItem('setting');
  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: setting.iv
    },
    password,
    cipher
  );
  return JSON.parse(decrypted.toString(enc.Utf8));
}

export async function verifyPassword(password: string, hash: string): boolean {
  return await argon2Verify({
    password,
    hash,
  });
}

export async function updatePassword(newPassword: string, prevPassword?: string, hash?: string) {
  if (prevPassword) {
    const isvalid = verifyPassword(prevPassword, hash);
    if (!isvalid) {
      throw new Error('Invalid password');
    }
  }
  const salt = new Uint8Array(16);
  window.crypto.getRandomValues(salt);

  const key = await argon2id({
    password: newPassword,
    salt, // salt is a buffer containing random bytes
    parallelism: 2,
    iterations: 256,
    memorySize: 512, // use 512KB memory
    hashLength: 32, // output size = 32 bytes
    outputType: 'encoded', // return standard encoded string containing parameters needed to verify the key
  });

  // Update Password
  const setting = await getStorageItem('setting');
  setting.hash = key;
  console.log('setting: ', setting);
  await setStorageItem('setting', setting);

  return key;
}
