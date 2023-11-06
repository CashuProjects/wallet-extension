import {
	CashuMint,
	CashuWallet,
	getEncodedToken,
	getDecodedToken,
	getDecodedLnInvoice,
	Token,
	TokenEntry,
	Proof
} from '@cashu/cashu-ts';

import { TokenStore, getStorageItem, setStorageItem } from './storage.js';

import { cleanToken } from './util.js';

export interface WalletIndexedWithMintUrl {
	[index: string]: CashuWallet;
}

export interface Balance {
	[index: string]: number;
}

export interface RequestMintResponse {
	pr: string; // Bolt11 invoice
	hash: string; // used to verify invoice has been paid
}

export class Wallet {
	_wallets: WalletIndexedWithMintUrl;
	_mints: CashuMint[];

	constructor(mintUrls: string[]) {
		this._mints = [];
		this._wallets = {};

		for (let mintUrl of mintUrls) {
			let mint = new CashuMint(mintUrl);
			let wallet = new CashuWallet(mint);
			this._wallets[mintUrl] = wallet;
			this._mints.push(mint);
		}
	}

	async requestMint(amount: number, mintUrl: string): Promise<RequestMintResponse> {
		//  return Bolt11 invoice to be paid and hash for verifying
		return await this._wallets[mintUrl].requestMint(amount);
	}

	async invoiceHasBeenPaid(amount: number, hash: string, mintUrl: string) {
		const { proofs } = await this._wallets[mintUrl].requestTokens(amount, hash);
		// Add proofs to Storage
		await this.storeProofs(proofs, mintUrl);
	}

	async addfunds(encodedToken: string, amount?: number) {
		const response = cleanToken(getDecodedToken(encodedToken));

		const tokenFromUnsupportedMint: Array<TokenEntry> = [];
		const tokenEntries: Array<TokenEntry> = [];
		const tokenEntriesWithError: Array<TokenEntry> = [];

		for (const tokenEntry of response.token) {
			if (!tokenEntry?.proofs?.length) {
				continue;
			}

			if (!(tokenEntry.mint in this._wallets)) {
				tokenFromUnsupportedMint.push(tokenEntry);
			}

			try {
				const { proofsWithError, proofs } = await this._wallets[
					tokenEntry.mint
				].receiveTokenEntry(tokenEntry);
				if (proofsWithError?.length) {
					tokenEntriesWithError.push(tokenEntry);
					continue;
				}
				tokenEntries.push({ mint: tokenEntry.mint, proofs: [...proofs] });
			} catch (error) {
				console.error(error);
				tokenEntriesWithError.push(tokenEntry);
			}
		}
		// There is a possibility of a token having some error or been spent alreadly spent

		let totalSum = 0;
		// Add tokens to db
		for (let token of tokenEntries) {
			for (let proof of token.proofs) {
				totalSum += proof.amount;
			}
			await this.storeProofs(token.proofs, token.mint);
		}

		return {
			token: { token: tokenEntries },
			tokensWithErrors: { token: tokenEntriesWithError },
			tokenFromUnsupportedMint,
			totalSum
		};
	}

	async getbalance(mintUrl?: string): Promise<Balance> {
		let tokens = await getStorageItem('tokens');
		let balance = <Balance>{};
		let totalSum = 0;
		if (mintUrl) {
			for (let proof of tokens[mintUrl]) {
				totalSum += proof.amount;
			}
			balance[mintUrl] = totalSum;
		} else {
			for (let mint of Object.keys(tokens)) {
				for (let proof of tokens[mint]) {
					totalSum += proof.amount;
				}
				balance[mint] = totalSum;
				totalSum = 0;
			}
		}

		return balance;
	}

	async payoutToLN(invoice: string, mintUrl: string, amount?: number): Promise<boolean> {
		let wallet = this._wallets[mintUrl];
		let feeReserve = await wallet.getFee(invoice);

		let decodedInvoice = getDecodedLnInvoice(invoice);

		for (let section of decodedInvoice.sections) {
			if (section['name'] == 'amount') {
				amount = amount || section['value'];
				//assert(amount == section['value'])
			}
		}

		// Get proof for amount
		let { proofs } = await this.getProofs(amount, mintUrl);

		// Melt tokens and pay Invoice
		const { isPaid } = await wallet.payLnInvoice(invoice, proofs, feeReserve);

		if (isPaid) {
			// Delete proofs
			await this.deleteProofs(proofs, mintUrl);
		}
		return isPaid;
	}

	async swap(from: string, to: string, amount: number) {
		let data = await this._wallets[to].requestMint(amount);
		let feeReserve = await this._wallets[from].getFee(data.pr);
		let { proofs: spend_proofs } = await this.getProofs(amount + feeReserve, from);
		const { isPaid, preimage, change } = await this._wallets[from].payLnInvoice(
			data.pr,
			spend_proofs,
			feeReserve
		);

		if (change) {
			await this.storeProofs(change, from);
		}

		if (isPaid) {
			const { proofs } = await this._wallets[to].requestTokens(amount, data.hash);

			await this.storeProofs(proofs, to);
			await this.deleteProofs(spend_proofs, from);
		}
		return { success: isPaid, amount: amount };
	}

	async storeProofs(proofs: Proof[], mintUrl: string) {
		console.log('storeProofs');
		let tokens = await getStorageItem('tokens');

		console.log('storeProofs 2');
		tokens[mintUrl] = [...tokens[mintUrl], ...proofs];
		await setStorageItem('tokens', tokens);

		console.log('exit storeProofs');
	}

	async getProofs(amount: number, mintUrl: string) {
		let totalSum = 0;
		let responseproofs = [];
		const proofs = (await getStorageItem('tokens'))[mintUrl];

		let iterator = 0;
		while (totalSum <= amount && iterator < proofs.length) {
			totalSum += proofs[iterator].amount;
			responseproofs.push(proofs[iterator]);
			iterator++;
		}
		if (totalSum > amount) {
			let response = await this._wallets[mintUrl].send(amount, responseproofs);
			await this.deleteProofs(responseproofs, mintUrl);
			await this.storeProofs(response.returnChange, mintUrl);
			await this.storeProofs(response.send, mintUrl);
			responseproofs = response.send;
			totalSum = amount;
		}
		return { proofs: responseproofs, totalSum };
	}

	async deleteProofs(proofs: Proof[], mintUrl: string) {
		const tokens = await getStorageItem('tokens');

		const store_proofs = tokens[mintUrl].filter(tk_proof => {
			for (let proof of proofs) {
				if (tk_proof.secret == proof.secret) {
					return false;
				}
			}
			return true;
		});
		tokens[mintUrl] = store_proofs;
		await setStorageItem('tokens', tokens);
	}
}
