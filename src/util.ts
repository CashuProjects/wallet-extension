import { Token, TokenEntry, Proof } from '@cashu/cashu-ts';

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
