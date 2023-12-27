import { initializeStorageWithDefaults } from './storage';
//import { Wallet } from './wallet'
import { generateRandomString } from './util';


chrome.runtime.onInstalled.addListener(async () => {
    const iv = generateRandomString(12);  // window.crypto.getRandomValues(new Uint8Array(12));
  // Here goes everything you want to execute after extension initialization

  await initializeStorageWithDefaults({
    tokens: {},
    transactionHistory: [],
    invoices: [],
    setting: {
        iv,
    }
  });

  console.log('Extension successfully installed!');
});

// Debug: Log storage changes, might be safely removed
chrome.storage.onChanged.addListener((changes) => {
  for (const [key, value] of Object.entries(changes)) {
    console.log(`"${key}" changed from "${value.oldValue}" to "`,);
    console.log(value.newValue);
  }
});
