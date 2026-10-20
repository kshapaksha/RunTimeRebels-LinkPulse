document.addEventListener("DOMContentLoaded", () => {
  // 1. Get the current active user/owner name from local storage or form cookies
  const currentOwner = localStorage.getItem("lp_owner") || "anonymous";

  // 2. Fetch the links directly from your native endpoint using the correct owner parameter
  fetch(`/api/links?owner=${currentOwner}`)
    .then(res => {
      if (!res.ok) throw new Error("Failed to load dashboard data");
      return res.json();
    })
    .then(data => {
      const linksBody = document.getElementById("links-body");
      const emptyMsg = document.getElementById("empty");

      // Verify if links exist
      if (!data || data.length === 0) {
        if (emptyMsg) emptyMsg.classList.remove("hidden");
        linksBody.innerHTML = "";
        return;
      }

      if (emptyMsg) emptyMsg.classList.add("hidden");

      // Populate your exact HTML table layout columns dynamically
      linksBody.innerHTML = data.map(link => {
        const shortUrl = window.location.origin + "/" + link.code;
        const statusText = link.blocked ? "Blocked" : "Active";
        const statusColor = link.blocked ? "#ef4444" : "#10b981";

        return `
          <tr>
            <td><a href="/${link.code}" target="_blank" style="color: #38bdf8; text-decoration: none; font-weight: 500;">/${link.code}</a></td>
            <td style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${link.url || 'Target Link'}</td>
            <td><b>${link.clicks || 0}</b></td>
            <td><span style="color: ${statusColor}; font-weight: bold;">${statusText}</span></td>
            <td>
              <button type="button" style="background: none; border: none; cursor: pointer; font-size: 1.1rem;" onclick="navigator.clipboard.writeText('${shortUrl}')">
                📋
              </button>
            </td>
          </tr>
        `;
      }).join('');
    })
    .catch(err => {
      console.error("Dashboard connection error:", err);
      const linksBody = document.getElementById("links-body");
      if (linksBody) {
        linksBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#ef4444;">Failed to sync with link pulse servers.</td></tr>`;
      }
    });
});
