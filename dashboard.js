const owner = getOwner();


function makeCell(text, className) {
    const cell = document.createElement("td");
    cell.textContent = text;
    if (className) {
        cell.className = className;
    }
    return cell;
}


async function loadLinks() {
    const response = await fetch("/api/links?owner=" + owner);
    const links = await response.json();

    const tableBody = document.getElementById("links-body");
    const emptyMessage = document.getElementById("empty");
    tableBody.innerHTML = "";

    if (links.length === 0) {
        emptyMessage.classList.remove("hidden");
    } else {
        emptyMessage.classList.add("hidden");
    }

    for (let i = 0; i < links.length; i++) {
        const link = links[i];
        const shortUrl = location.origin + "/" + link.code;
        const row = document.createElement("tr");

        row.appendChild(makeCell(shortUrl));
        row.appendChild(makeCell(link.url, "long"));
        row.appendChild(makeCell(link.clicks));

        const statusCell = document.createElement("td");
        const badge = document.createElement("span");
        let statusText = link.status;
        if (link.protected) {
            statusText = statusText + " · 🔒";
        }
        if (link.status === "Active") {
            badge.className = "badge ok";
        } else {
            badge.className = "badge bad";
        }
        badge.textContent = statusText;
        statusCell.appendChild(badge);
        row.appendChild(statusCell);


        const buttonCell = document.createElement("td");
        const button = document.createElement("button");
        button.className = "btn btn-small btn-ghost";
        button.textContent = "Analytics";
        button.addEventListener("click", function () {
            showStats(link.code, shortUrl);
        });
        buttonCell.appendChild(button);
        row.appendChild(buttonCell);

        tableBody.appendChild(row);
    }
}

function drawBars(boxId, pairs) {
    const box = document.getElementById(boxId);
    box.innerHTML = "";

    if (pairs.length === 0) {
        box.textContent = "No data yet";
        return;
    }


    let biggest = 0;
    for (let i = 0; i < pairs.length; i++) {
        if (pairs[i][1] > biggest) {
            biggest = pairs[i][1];
        }
    }


    for (let i = 0; i < pairs.length; i++) {
        const name = pairs[i][0];
        const count = pairs[i][1];

        const row = document.createElement("div");
        row.className = "bar-row";

        const label = document.createElement("span");
        label.textContent = name;

        const bar = document.createElement("div");
        bar.className = "bar";
        const fill = document.createElement("i");
        fill.style.width = (count / biggest) * 100 + "%";
        bar.appendChild(fill);

        const number = document.createElement("span");
        number.textContent = count;

        row.appendChild(label);
        row.appendChild(bar);
        row.appendChild(number);
        box.appendChild(row);
    }
}



async function showStats(code, shortUrl) {
    const response = await fetch("/api/stats/" + code + "?owner=" + owner);
    const stats = await response.json();

    document.getElementById("stats").classList.remove("hidden");
    document.getElementById("stats-title").textContent = "Analytics for " + shortUrl;
    document.getElementById("s-total").textContent = stats.total;


    let topCountry = "-";
    if (stats.countries.length > 0) {
        topCountry = stats.countries[0][0];
    }
    document.getElementById("s-top-country").textContent = topCountry;


    let topReferrer = "-";
    if (stats.referrers.length > 0) {
        topReferrer = stats.referrers[0][0];
    }
    document.getElementById("s-top-ref").textContent = topReferrer;

    let rating = "-";
    if (stats.avg_rating !== null) {
        rating = stats.avg_rating;
    }
    document.getElementById("s-rating").textContent = rating;


    drawBars("b-countries", stats.countries);
    drawBars("b-referrers", stats.referrers);
    drawBars("b-devices", stats.devices);
    drawBars("b-browsers", stats.browsers);
    drawBars("b-days", stats.days);

    document.getElementById("stats").scrollIntoView({ behavior: "smooth" });
}


loadLinks();