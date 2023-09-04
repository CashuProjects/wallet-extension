(()=>{var n="https://mint-url-here.com";function e(n){return n.filter((function(n){return!n.burned}))}chrome.runtime.onInstalled.addListener((function(e){"install"!==e.reason&&"update"!==e.reason||fetch("".concat(n,"/keys")).then((function(n){return n.json()})).then((function(n){return chrome.storage.local.set({mintKeys:n}),n})).catch((function(n){console.error("Error fetching mint public keys:",n)}))})),chrome.runtime.onMessage.addListener((function(t,r,o){switch(t.action){case"mintTokens":(k=t.amount,fetch("".concat(n,"/mint?amount=").concat(k)).then((function(n){return n.json()})).then((function(n){return{payment_request:n.payment_request,hash:n.hash}})).catch((function(n){console.error("Error in requestMint:",n)}))).then((function(e){e.payment_request;var r=e.hash;return function(e,t){var r={outputs:e};return fetch("".concat(n,"/mint?hash=").concat(t),{method:"POST",body:JSON.stringify(r),headers:{"Content-Type":"application/json"}}).then((function(n){return n.json()})).then((function(n){return n})).catch((function(n){console.error("Error in mintTokens:",n)}))}(function(n){for(var e=[],t=0;t<n;t++){var r=Math.random().toString(36).substring(2,15);e.push(r)}return e}(t.amount).map((function(n){return{output:n+"_output"}})),r)})).then((function(n){return o(n)})).catch((function(n){return o({error:n.message})}));break;case"sendTokens":var c=function(n,e){return{totalTokens:n,aliceRemainingTokens:e-n}}(t.total,t.alice_balance),a=c.total,s=(c.aliceRemainingTokens,l=a,btoa(JSON.stringify(l)));o({success:!0,tokens:s});break;case"redeemTokens":var i=(m=t.tokens,JSON.parse(atob(m)));o({tokens:i});break;case"checkBurnedTokens":var u=e(t.tokens);o({tokens:u});break;case"payInvoice":(h=t.invoice,f={pr:h},fetch("".concat(n,"/checkfee"),{method:"POST",body:JSON.stringify(f),headers:{"Content-Type":"application/json"}}).then((function(n){return n.json()})).then((function(n){var e=n.fee,t=h.amount+e;return{invoice:h,total:t,fee:e}})).catch((function(n){console.error("Error in payLightningInvoice:",n)}))).then((function(n){return o(n)})).catch((function(n){return o({error:n.message})}));break;default:o({error:"Unknown action"})}var h,f,m,l,k;return!0})),chrome.alarms.create("checkBurnedTokens",{periodInMinutes:10}),chrome.alarms.onAlarm.addListener((function(n){"checkBurnedTokens"===n.name&&chrome.storage.local.get("tokens",(function(n){var t=e(n.tokens);chrome.storage.local.set({tokens:t})}))})),chrome.tabs.query({active:!0,currentWindow:!0},(function(n){var e=n[0];chrome.tabs.sendMessage(e.id,{action:"autofillPayment",data:{}})}))})();