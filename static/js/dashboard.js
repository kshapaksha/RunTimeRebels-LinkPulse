document.addEventListener("DOMContentLoaded", () => {
  
  const currentOwner = localStorage.getItem("lp_owner") || "anonymous"; 

 
  fetch(`/api/links?owner=${encodeURIComponent(currentOwner)}`)
    .then(res => {
      if(!res.ok) throw new Error("Secure dashboard sync failed");
      return res.json();
    })
    .then(data => {
      const linksBody = document.getElementById("links-body");
      const emptyMsg = document.getElementById("empty");
      
      if (!data || data.length === 0) {
        if(emptyMsg) emptyMsg.classList.remove("hidden");
        if(linksBody) linksBody.innerHTML = "";
        return;
      }

      if(emptyMsg) emptyMsg.classList.add("hidden");
      
      linksBody.innerHTML = data.map(link => {
        const shortUrl = window.location.origin + "/" + link.code;
        const statusColor = link.status === "Active" ? "#10b981" : "#ef4444";
        
        return `
          <tr>
            <td><a href="/${link.code}" target="_blank" style="color: #38bdf8; text-decoration: none; font-weight: 500;">/${link.code}</a></td>
            <td style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${link.url || 'Target Link'}</td>
            <td><b>${link.clicks || 0}</b></td>
            <td><span style="color: ${statusColor}; font-weight: bold;">${link.status}</span></td>
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
      console.error("Dashboard multi-user load warning:", err);
      const linksBody = document.getElementById("links-body");
      if(linksBody) {
        linksBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#ef4444;">Failed to sync with link pulse servers.</td></tr>`;
      }
    });
});
