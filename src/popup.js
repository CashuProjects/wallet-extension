import browser from 'webextension-polyfill';

// Update balance display
function updateBalanceDisplay() {
  browser.runtime.sendMessage({ action: "getBalance" })
    .then(response => {
      document.getElementById('balance').textContent = response.balance;
    });
}

// Send tokens
document.getElementById('confirmSendButton').addEventListener('click', () => {
  const recipient = document.getElementById('recipientAddress').value;
  const amount = document.getElementById('amountToSend').value;

  browser.runtime.sendMessage({ action: "sendTokens", recipient: recipient, amount: amount })
    .then(response => {
      if (response.success) {
        document.getElementById('sendFeedback').textContent = "Tokens sent successfully!";
        updateBalanceDisplay();
      } else {
        alert(response.success);
        alert(response.tokens);
        document.getElementById('sendFeedback').textContent = "Error sending tokens.";
      }
    });
});

// Generate receiving address
document.getElementById('generateAddressButton').addEventListener('click', () => {
  // Placeholder for generating a real receiving address
  const address = "cashu_" + Math.random().toString(36).substring(2, 15);
  document.getElementById('receivingAddress').textContent = address;
});

// Update transaction history
function updateTransactionHistory() {
  browser.runtime.sendMessage({ action: "getTransactions" })
    .then(response => {
      const transactionList = document.getElementById('transactionList');
      transactionList.innerHTML = ''; // Clear previous transactions

      response.transactions.forEach(tx => {
        const listItem = document.createElement('li');
        listItem.textContent = `${tx.type}: ${tx.amount} tokens ${tx.type === 'sent' ? 'to' : 'from'} ${tx.address}`;
        transactionList.appendChild(listItem);
      });
    });
}

// Update balance and transaction history when the popup is opened
updateBalanceDisplay();
updateTransactionHistory();
