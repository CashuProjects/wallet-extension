import browser from 'webextension-polyfill';

const MINT_URL = 'https://mint-url-here.com'; // Replace with the actual mint URL

function requestMintPublicKeys() {
  return fetch(`${MINT_URL}/keys`)
    .then(response => response.json())
    .then(data => {
      // Store the keys in local storage or another appropriate storage mechanism
      browser.storage.local.set({ mintKeys: data });
      return data;
    })
    .catch(error => {
      console.error("Error fetching mint public keys:", error);
    });
}

function requestMint(amount) {
  return fetch(`${MINT_URL}/mint?amount=${amount}`)
    .then(response => response.json())
    .then(data => {
      const { payment_request, hash } = data;
      // Here, you'd typically initiate the payment using the payment_request
      // Once the payment is done, you can proceed with the minting process
      return { payment_request, hash };
    })
    .catch(error => {
      console.error("Error in requestMint:", error);
    });
}

function generateSecrets(N) {
  const secrets = [];
  for (let i = 0; i < N; i++) {
    // Generate a secret (for simplicity, using random strings)
    const secret = Math.random().toString(36).substring(2, 15);
    secrets.push(secret);
  }
  return secrets;
}

function generateOutputs(secrets) {
  // This is a placeholder. The actual logic will depend on the cryptographic operations required.
  return secrets.map(secret => {
    return {
      output: secret + "_output" // Placeholder logic
    };
  });
}

function mintTokens(outputs, hash) {
  const body = {
    outputs: outputs
  };
  return fetch(`${MINT_URL}/mint?hash=${hash}`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json'
    }
  })
    .then(response => response.json())
    .then(data => {
      // Handle the received promises (blinded signatures)
      return data;
    })
    .catch(error => {
      console.error("Error in mintTokens:", error);
    });
}

function splitTokens(total, alice_balance) {
  // Placeholder logic to split tokens
  return {
    totalTokens: total,
    aliceRemainingTokens: alice_balance - total
  };
}

function serializeTokensForSending(proofs) {
  // Serialize the proofs into a format suitable for sending
  return btoa(JSON.stringify(proofs)); // Base64 encode the proofs
}

function redeemTokens(tokens) {
  // Placeholder logic to redeem tokens
  const decodedTokens = JSON.parse(atob(tokens)); // Base64 decode and parse the tokens
  return decodedTokens;
}

function checkBurnedTokens(tokens) {
  // Placeholder logic to check if tokens have been burned
  return tokens.filter(token => !token.burned); // Return only tokens that haven't been burned
}

function payLightningInvoice(invoice) {
  const body = {
    pr: invoice
  };
  return fetch(`${MINT_URL}/checkfee`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json'
    }
  })
    .then(response => response.json())
    .then(data => {
      const { fee } = data;
      const total = invoice.amount + fee;
      return { invoice, total, fee };
    })
    .catch(error => {
      console.error("Error in payLightningInvoice:", error);
    });
}

browser.runtime.onInstalled.addListener(details => {
  if (details.reason === "install" || details.reason === "update") {
    requestMintPublicKeys();
  }
});

browser.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  try {
    switch (message.action) {
      case "mintTokens":
        const { payment_request, hash } = await requestMint(message.amount);
        // Here, you'd typically initiate the payment using the payment_request
        // Once the payment is done, you can proceed with the minting process
        const secrets = generateSecrets(message.amount);
        const outputs = generateOutputs(secrets);
        const data = await mintTokens(outputs, hash);
        sendResponse(data);
        break;

      case "sendTokens":
        const { total, aliceRemainingTokens } = splitTokens(message.total, message.alice_balance);
        const serializedTokens = serializeTokensForSending(total);        
        // Send the serialized tokens to the recipient (this would involve another mechanism, possibly a content script or direct communication)
        sendResponse({ success: true, tokens: serializedTokens });
        break;

      case "redeemTokens":
        const redeemedTokens = redeemTokens(message.tokens);
        sendResponse({ tokens: redeemedTokens });
        break;

      case "checkBurnedTokens":
        const unburnedTokens = checkBurnedTokens(message.tokens);
        sendResponse({ tokens: unburnedTokens });
        break;

      case "payInvoice":
        const invoiceData = await payLightningInvoice(message.invoice);
        sendResponse(invoiceData);
        break;

      default:
        sendResponse({ error: "Unknown action" });
    }
  } catch (error) {
    sendResponse({ error: error.message });
  }

  // This ensures asynchronous use of sendResponse
  return true;
});

// Set up an alarm to check burned tokens every 10 minutes
browser.alarms.create("checkBurnedTokens", { periodInMinutes: 10 });

browser.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === "checkBurnedTokens") {
    // Retrieve tokens from storage and check if they've been burned
    browser.storage.local.get("tokens", ({ tokens }) => {
      const unburnedTokens = checkBurnedTokens(tokens);
      // Update storage with the unburned tokens
      browser.storage.local.set({ tokens: unburnedTokens });
    });
  }
});

// Example: Send a message to the active tab's content script
browser.tabs.query({ active: true, currentWindow: true }, tabs => {
  const activeTab = tabs[0];
  browser.tabs.sendMessage(activeTab.id, { action: "autofillPayment", data: { /* ... */ } });
});
