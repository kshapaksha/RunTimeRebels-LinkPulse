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
    
  let typed = document.getElementById("fb-code").value.trim();
  if (typed.endsWith("/")) {
    typed = typed.slice(0, -1);
  }
  const code = typed.split("/").pop();
  const dataToSend = {
    code: code,
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

async function sendSiteFeedback(event) {
  event.preventDefault();
  const status = document.getElementById("sf-status");

  const dataToSend = {
    rating: Number(document.getElementById("sf-rating").value),
    message: document.getElementById("sf-message").value.trim(),
  };

  const response = await fetch("/api/site-feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dataToSend),
  });
  const result = await response.json();

  if (response.ok) {
    status.textContent = "Thank you for your feedback!";
    document.getElementById("sf-message").value = "";
  } else {
    status.textContent = result.error;
  }
}

// ---------- Live stats for the whole website ----------
function drawLeaderboard(boxId, pairs) {
  const box = document.getElementById(boxId);
  box.innerHTML = "";

  if (pairs.length === 0) {
    box.textContent = "No data yet";
    return;
  }

  // the biggest number gets the longest bar
  let biggest = 0;
  for (let i = 0; i < pairs.length; i++) {
    if (pairs[i][1] > biggest) {
      biggest = pairs[i][1];
    }
  }

  for (let i = 0; i < pairs.length; i++) {
    const row = document.createElement("div");
    row.className = "bar-row";

    const label = document.createElement("span");
    label.textContent = pairs[i][0];

    const bar = document.createElement("div");
    bar.className = "bar";
    const fill = document.createElement("i");
    fill.style.width = (pairs[i][1] / biggest) * 100 + "%";
    bar.appendChild(fill);

    const number = document.createElement("span");
    number.textContent = pairs[i][1];

    row.appendChild(label);
    row.appendChild(bar);
    row.appendChild(number);
    box.appendChild(row);
  }
}


async function loadGlobalStats() {
  const response = await fetch("/api/global-stats");
  const stats = await response.json();

  document.getElementById("g-links").textContent = stats.total_links;
  document.getElementById("g-clicks").textContent = stats.total_clicks;
  drawLeaderboard("g-countries", stats.countries);
  drawLeaderboard("g-referrers", stats.referrers);
    drawLeaderboard("g-sites", stats.shortened_sites);
}

form.addEventListener("submit", makeShortLink);
copyButton.addEventListener("click", copyLink);
feedbackForm.addEventListener("submit", sendFeedback);
document.getElementById("site-feedback-form").addEventListener("submit", sendSiteFeedback);
loadGlobalStats();
