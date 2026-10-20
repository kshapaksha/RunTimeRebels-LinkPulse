
document.addEventListener("DOMContentLoaded", async () => {
  const owner = localStorage.getItem("lp_owner") || "anonymous";
  const body = document.getElementById("links-body");
  const empty = document.getElementById("empty");
  const statsSection = document.getElementById("stats");

  function showMessage(message) {
    body.innerHTML = "";
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 5;
    cell.textContent = message;
    row.appendChild(cell);
    body.appendChild(row);
  }

  function drawList(id, items) {
    const box = document.getElementById(id);
    box.innerHTML = "";

    if (!items || items.length === 0) {
      box.textContent = "No data yet";
      return;
    }

    items.forEach(item => {
      const row = document.createElement("p");
      row.textContent = `${item[0]}: ${item[1]}`;
      box.appendChild(row);
    });
  }

  try {
    const response = await fetch(
      `/api/links?owner=${encodeURIComponent(owner)}`
    );

    if (!response.ok) {
      throw new Error(`Links request failed: ${response.status}`);
    }

    const links = await response.json();
    body.innerHTML = "";

    if (!links.length) {
      empty.classList.remove("hidden");
      return;
    }

    empty.classList.add("hidden");

    links.forEach(link => {
      const row = document.createElement("tr");

      const shortCell = document.createElement("td");
      const shortAnchor = document.createElement("a");
      shortAnchor.href = `/${encodeURIComponent(link.code)}`;
      shortAnchor.textContent = `/${link.code}`;
      shortAnchor.target = "_blank";
      shortAnchor.rel = "noopener noreferrer";
      shortCell.appendChild(shortAnchor);

      const urlCell = document.createElement("td");
      urlCell.textContent = link.url || "Target link";

      const clicksCell = document.createElement("td");
      clicksCell.textContent = link.clicks || 0;

      const statusCell = document.createElement("td");
      statusCell.textContent = link.status;

      const actionCell = document.createElement("td");

      const copyButton = document.createElement("button");
      copyButton.type = "button";
      copyButton.textContent = "Copy";
      copyButton.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(
            `${location.origin}/${link.code}`
          );
          copyButton.textContent = "Copied!";
          setTimeout(() => copyButton.textContent = "Copy", 1200);
        } catch {
          copyButton.textContent = "Copy failed";
        }
      });

      const statsButton = document.createElement("button");
      statsButton.type = "button";
      statsButton.textContent = "Analytics";
      statsButton.addEventListener("click", () => loadStats(link.code));

      actionCell.append(copyButton, statsButton);
      row.append(shortCell, urlCell, clicksCell, statusCell, actionCell);
      body.appendChild(row);
    });
  } catch (error) {
    console.error(error);
    showMessage("Could not load links. Please reload the page.");
  }

  async function loadStats(code) {
    try {
      const response = await fetch(
        `/api/stats/${encodeURIComponent(code)}?owner=${encodeURIComponent(owner)}`
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Could not load analytics.");
        return;
      }

      statsSection.classList.remove("hidden");
      document.getElementById("stats-title").textContent =
        `Analytics for /${code}`;
      document.getElementById("s-total").textContent = data.total;
      document.getElementById("s-top-country").textContent =
        data.countries?.[0]?.[0] || "-";
      document.getElementById("s-top-ref").textContent =
        data.referrers?.[0]?.[0] || "-";
      document.getElementById("s-rating").textContent =
        data.avg_rating ?? "-";

      drawList("b-countries", data.countries);
      drawList("b-referrers", data.referrers);
      drawList("b-devices", data.devices);
      drawList("b-browsers", data.browsers);
      drawList("b-days", data.days);
      statsSection.scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      console.error(error);
      alert("Analytics could not be loaded.");
    }
  }
});
