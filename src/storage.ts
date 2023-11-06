import { Proof, Token } from '@cashu/cashu-ts';

// represents how tokens are stored in the storage
export interface TokenStore {
	[index: string]: Proof[]; // Array of proof minted by <mint url>
}

export enum TransactionStatus {
	CONFIRMED = 1,
	SUCCESSFUL = 2,
	FAILED = 3,
	INCOMPLETE = 4
}

export enum TransactionType {
	RECIEVE = 1,
	SEND = 2,
	PAYMENT = 3
}

export interface TransactionHistory {
	amount: number;
	date: number; // TimeStamp
	status: TransactionStatus;
	type: TransactionType;
	token?: Token;
}

export interface invoice {
	bolt11: string;
	mint: string; // URL of mint which created the bolt11 invoice
}

export interface Setting {
	password_hash: string; // `bcrypt` hash of password
	mints: string[];
}

export interface Storage {
	tokens: TokenStore;
	transactionHistory: TransactionHistory[];
	invoice: string[]; //  Bolt11 invoice
	setting: Setting;
}

export function getStorageData(): Promise<Storage> {
	return new Promise((resolve, reject) => {
		chrome.storage.sync.get(null, result => {
			if (chrome.runtime.lastError) {
				return reject(chrome.runtime.lastError);
			}

			return resolve(result as Storage);
		});
	});
}

export function setStorageData(data: Storage): Promise<void> {
	return new Promise((resolve, reject) => {
		chrome.storage.sync.set(data, () => {
			if (chrome.runtime.lastError) {
				return reject(chrome.runtime.lastError);
			}

			return resolve();
		});
	});
}

export function getStorageItem<Key extends keyof Storage>(key: Key): Promise<Storage[Key]> {
	return new Promise((resolve, reject) => {
		chrome.storage.sync.get([key], result => {
			if (chrome.runtime.lastError) {
				return reject(chrome.runtime.lastError);
			}
			return resolve((result as Storage)[key]);
		});
	});
}

export function setStorageItem<Key extends keyof Storage>(
	key: Key,
	value: Storage[Key]
): Promise<void> {
	return new Promise((resolve, reject) => {
		chrome.storage.sync.set({ [key]: value }, () => {
			if (chrome.runtime.lastError) {
				return reject(chrome.runtime.lastError);
			}

			return resolve();
		});
	});
}

export async function initializeStorageWithDefaults(defaults: Storage) {
	const currentStorageData = await getStorageData();
	const newStorageData = Object.assign({}, defaults, currentStorageData);
	await setStorageData(newStorageData);
}
