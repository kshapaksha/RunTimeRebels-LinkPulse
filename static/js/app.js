const form = document.getElementById("shorten-form");
const errorBox = document.getElementById("error");
const resultBox = document.getElementById("result");
const copyButton = document.getElementById("copy-btn");
const feedbackForm = document.getElementById("feedback-form");



async function makeShortLink(event) {
  event.preventDefault();               
  errorBox.classList.add("hidden");     

  const dataToSend = {
    url: document.getElementById("url").value.trim(),
    password: document.getElementById("password").value,
    expires: document.getElementById("expires").value,
    owner: getOwner(),
  };

  
  const response = await fetch("/api/shorten", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dataToSend),
  });
  const result = await response.json();

 
  if (!response.ok) {
    errorBox.textContent = result.error;
    errorBox.classList.remove("hidden");
    return;
  }
  const shortUrl = location.origin + "/" + result.code;
  document.getElementById("short-url").value = shortUrl;
  document.getElementById("qr-img").src = "/api/qr/" + result.code;
  document.getElementById("qr-download").href = "/api/qr/" + result.code;
  resultBox.classList.remove("hidden");
}



function copyLink() {
  const shortUrl = document.getElementById("short-url").value;
  navigator.clipboard.writeText(shortUrl);

  copyButton.textContent = "Copied!";
  setTimeout(function () {
    copyButton.textContent = "Copy";
  }, 1500);
}



async function sendFeedback(event) {
  event.preventDefault();
  const status = document.getElementById("fb-status");

  const dataToSend = {
    code: document.getElementById("fb-code").value.trim(),
    type: document.getElementById("fb-type").value,
    rating: Number(document.getElementById("fb-rating").value),
    message: document.getElementById("fb-message").value,
  };

  const response = await fetch("/api/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dataToSend),
  });
  const result = await response.json();

  if (response.ok) {
    status.textContent = "Thanks! Your response was recorded.";
  } else {
    status.textContent = result.error;
  }
}



form.addEventListener("submit", makeShortLink);
copyButton.addEventListener("click", copyLink);
feedbackForm.addEventListener("submit", sendFeedback);