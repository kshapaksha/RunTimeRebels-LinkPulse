
function getOwner() {
  let owner = localStorage.getItem("lp_owner");

  if (owner === null) {

    owner = crypto.randomUUID();
    localStorage.setItem("lp_owner", owner);
  }

  return owner;
}


function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("lp_theme", theme);

  const button = document.getElementById("theme-toggle");
  if (button) {
    if (theme === "dark") {
      button.textContent = "☀️";    
    } else {
      button.textContent = "🌙";    
    }
  }
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme");
  if (current === "dark") {
    applyTheme("light");
  } else {
    applyTheme("dark");
  }
}


applyTheme(localStorage.getItem("lp_theme") || "light");

const themeButton = document.getElementById("theme-toggle");
if (themeButton) {
  themeButton.addEventListener("click", toggleTheme);
}