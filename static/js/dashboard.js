document.addEventListener("DOMContentLoaded", () => {
 
  const currentUserId = "global_fallback"; 

  
  fetch(`/api/analytics?mode=global`)
    .then(res => res.json())
    .then(globalData => {
      
     
      document.getElementById("stats").classList.remove("hidden");
      document.getElementById("s-total").innerText = globalData.totalClicks || 0;
      document.getElementById("s-rating").innerText = "4.8";

  
      if (globalData.topCountries && globalData.topCountries.length > 0) {
        document.getElementById("s-top-country").innerText = globalData.topCountries[0].name;
      }
      if (globalData.topReferrers && globalData.topReferrers.length > 0) {
        document.getElementById("s-top-ref").innerText = globalData.topReferrers[0].name;
      }

     
      const countriesBox = document.getElementById("b-countries");
      countriesBox.innerHTML = globalData.topCountries.map(c => `
        <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
          <span>📍 ${c.name}</span>
          <b>${c.count} clicks</b>
        </div>
      `).join('') || '<p class="muted">No data logged yet.</p>';

      const referrersBox = document.getElementById("b-referrers");
      referrersBox.innerHTML = globalData.topReferrers.map(r => `
        <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
          <span>🌐 ${r.name}</span>
          <b>${r.count} hits</b>
        </div>
      `).join('') || '<p class="muted">No data logged yet.</p>';
    })
    .catch(err => console.error("Error reading global telemetry updates:", err));

  
  fetch(`/api/analytics?mode=personal&userId=${currentUserId}`)
    .then(res => res.json())
    .then(personalData => {
      const linksBody = document.getElementById("links-body");
      const emptyMsg = document.getElementById("empty");
      
      if (!personalData.links || personalData.links.length === 0) {
        emptyMsg.classList.remove("hidden");
      } else {
        emptyMsg.classList.add("hidden");
        linksBody.innerHTML = personalData.links.map(link => `
          <tr>
            <td><a href="/${link.id}" target="_blank">/${link.id}</a></td>
            <td style="max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${link.longUrl || 'Target Link'}</td>
            <td><b>${link.clicks || 0}</b></td>
            <td><span style="color:#10b981; font-weight:bold;">Active</span></td>
            <td><button style="cursor:pointer; background:none; border:none;" onclick="navigator.clipboard.writeText(window.location.origin + '/${link.id}')">📋</button></td>
          </tr>
        `).join('');
      }
    })
    .catch(err => console.error("Error loading personal link slots:", err));
});
