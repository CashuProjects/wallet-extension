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

import {
    TokenStore,
    Storage,
    getStorageData,
    setStorageData,
    getStorageItem,
    setStorageItem,
    initializeStorageWithDefaults,
} from './storage.js'

import {cleanToken} from './util.js'

interface WalletIndexedWithMintUrl {
    [index: string]: CashuWallet
}

interface Balance {
    [index: string]: number
}

interface RequestMintResponse {
    pr: string  // Bolt11 invoice
    hash: string  // used to verify invoice has been paid
}

class Wallet {
    _wallets: WalletIndexedWithMintUrl[]
    _mints: CashuMint[]

    constructor(mintUrls: string[]) {
        this._mints = []
        this._wallets = []

        for (mintUrl of mintUrls) {
            mint = new CashuMint(mintUrl)
            wallet = new CashuWallet(mint)
            this._wallets[mintUrl] = wallet
            this._mints.push(mint)
        }
    }

    async requestMint(amount: number, mintUrl: string):Promise<RequestMintResponse> {
        //  return Bolt11 invoice to be paid and hash for verifying
        return await this._wallet[mintUrl].requestMint(amount);
    }

    async invoiceHasBeenPaid(amount: number, hash: string, mintUrl: string) {
        const { proofs } = await this._wallet[mintUrl].requestMint(amount, hash);
        // Add proofs to Storage
        await storeProofs(proofs, mintUrl)
    }

    async addfunds(tokenStr: string, amount?: number){
        const response = cleanToken(getDecodedToken(encodedToken));
        tokenFromUnsupportedMint: Array<TokenEntry> = []
        const tokenEntries: Array<TokenEntry> = [];
        const tokenEntriesWithError: Array<TokenEntry> = [];
        for (const tokenEntry of response.token) {
            if (!tokenEntry?.proofs?.length) {
                continue;
            }
            
            if (!(tokenEntry.mint in this._wallets)) {
                tokenFromUnsupportedMint.push(tokenEntry)
            }

            try {
                const {
                    proofsWithError,
                    proofs,
                } = await CashuWallet.receiveTokenEntry(tokenEntry);
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

        totalSum = 0
        // Add tokens to db
        for (token of tokenEntries) {
            for (proof of token.proofs) {
                totalSum += proof.amount
            }
            await storeProofs(token.proofs, token.mint)
        }

        return {
            token: {token: tokenEntries},
            tokensWithErrors,
            tokenFromUnsupportedMint,
            totalSum
        }
    }

    async getbalance(mintUrl?: string): Balance {
        tokens = await getStorageItem('tokens')
        balance = {}
        totalSum = 0
        if {mintUrl} {
            for (proof of tokens[mintUrl]) {
                totalSum += proof.amount
            }
            balance[mintUrl] = totalSum
        }
        else {   
            for (mint of Object.keys(tokens)) {
                for (proof of tokens[mint]) {
                    totalSum += proof.amount
                }
                balance[token] = totalSum
                totalSum = 0
            }
        }

        return balance
    }

    async payoutToLN(invoice: string, mintUrl: string, amount?: number): boolean {
        wallet = this._wallets[mintUrl]
        feeReserve =  wallet.getFee(invoice)

        decodedInvoice = getDecodedLnInvoice(invoice)

        for (section of decodedInvoice.sections) {
            if (section['name'] == 'amount') {
                amount = amount || section['value']
                //assert(amount == section['value'])
            }
        }

        // Get proof for amount
        proofs = await this.getProofs(amount, mintUrl)

        // Melt tokens and pay Invoice
        const {isPaid, preimage, change} = wallet.payLnInvoice(invoice, proofs, feeReserve)

        if (isPaid) {
            // Delete proofs
            await this.deleteProofs(proofs, mintUrl)
        }
        return isPaid
    }

    async swap(from: string, to: string, amount) {
        wallet1 = this._wallets[to]
        data1 = this._wallets[to].requestMint(amount)
        feeReserve1 = this._wallets[from].getFee(data1.pr)
        spend_proofs = getProofs(amount+feeReserve, from)
        const {isPaid, preimage, change} = this._wallets[from].payLnInvoice(data1.pr, spend_proofs, feeReserve)
        if (isPaid) {
            const { proofs } = this._wallets[to].requestTokens(amount, data.hash)

            await this.storeProofs(proofs, to)
            await this.deleteProofs(spend_proofs, from) 
        }
        return {success: isPaid, amount: amount}
    }

    async storeProofs(proofs: Proof[], mintUrl: string) {
        tokens = (await getStorageItem('tokens'))
        tokens[mintUrl] = [...tokens[mintUrl], ...proofs]
        await setStorageItem('tokens', tokens)
    }

    async getProofs(amount: number, mintUrl: string) {
        totalSum = 0
        responseproofs = []
        proofs = (await getStorageItem('tokens'))[mintUrl]

        iterator = 0
        while (totalSum <= (amount) && iterator < proofs.length) {
            totalSum += proofs[iterator].amount
            responseproofs.push(proofs[iterator])
            iterator++
        }
        if (totalSum > amount) {
            response = this._wallets[mintUrl].send(amount, responseproofs)
            await this.deleteProofs(responseproofs, mintUrl)
            await this.storeProofs(response.returnChange, mintUrl)
            await this.storeProofs(response.send, mintUrl)
            responseproofs = response.send
            totalSum = amount
        }
        return {responseproofs, totalSum}
    }

     async deleteProofs(proofs: Proof[], mintUrl: string) {
        tokens = (await getStorageItem('tokens'))
        
        store_proofs = tokens[mintUrl].filter((tk_proof) => {
            for (proof of proofs) {
                if (tk_proof.secret == proof.secret) {
                    return false
                }
            }
            return true
        })
        tokens[mintUrl] = store_proofs 
        await setStorageItem('tokens', tokens)
    }

}