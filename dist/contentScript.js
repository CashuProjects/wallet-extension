(()=>{var e,t=document.querySelector(".cashu-payment-field");if(t){var n=document.createElement("button");n.textContent="Pay with Cashu",n.style.marginLeft="10px",t.parentElement.appendChild(n),n.addEventListener("click",(function(){var e=t.value;chrome.runtime.sendMessage({action:"payInvoice",invoice:e},(function(e){e.success?alert("Payment successful!"):alert("Payment failed. Please try again.")}))}))}(e=document.createElement("script")).textContent="\n  window.postMessage({\n      type: 'FROM_PAGE',\n      data: window.someVariable\n  }, '*');\n",(document.head||document.documentElement).appendChild(e),e.remove(),window.addEventListener("message",(function(e){e.source===window&&e.data.type&&"FROM_PAGE"===e.data.type&&console.log("Received from page:",e.data.data)}))})();