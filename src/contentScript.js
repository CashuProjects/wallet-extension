// Detect Cashu payment fields on the web page
const paymentField = document.querySelector('.cashu-payment-field');

if (paymentField) {
    // Create a button to initiate Cashu payment
    const payWithCashuButton = document.createElement('button');
    payWithCashuButton.textContent = "Pay with Cashu";
    payWithCashuButton.style.marginLeft = '10px';
    paymentField.parentElement.appendChild(payWithCashuButton);

    payWithCashuButton.addEventListener('click', () => {
        const invoice = paymentField.value;
        chrome.runtime.sendMessage({ action: "payInvoice", invoice: invoice }, response => {
            if (response.success) {
                alert('Payment successful!');
            } else {
                alert('Payment failed. Please try again.');
            }
        });
    });
}

function injectScript(content) {
  const script = document.createElement('script');
  script.textContent = content;
  (document.head || document.documentElement).appendChild(script);
  script.remove();
}

// Example: Inject a script to retrieve a variable from the page
injectScript(`
  window.postMessage({
      type: 'FROM_PAGE',
      data: window.someVariable
  }, '*');
`);

// Listen for messages from the page
window.addEventListener('message', event => {
  if (event.source !== window) return;
  if (event.data.type && event.data.type === 'FROM_PAGE') {
      console.log('Received from page:', event.data.data);
  }
});
