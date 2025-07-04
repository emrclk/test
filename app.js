const videoEl = document.getElementById("video");
const listContainer = document.getElementById("listContainer");
const searchInput = document.getElementById("searchInput");

const categories = { Canli: [], Film: [], Dizi: {} };
let currentCategory = "Canli";

const linkInput = document.getElementById("m3uInput");
const saveBtn = document.getElementById("saveLinkBtn");
const linkInputContainer = document.getElementById("linkInputContainer");

let m3uUrl = localStorage.getItem("m3uLink");

if (m3uUrl) {
  linkInputContainer.style.display = "none";
  fetchM3U(m3uUrl).then(() => showCanli()).catch(err => {
    listContainer.textContent = "M3U yüklenemedi: " + err.message;
  });
}

saveBtn.onclick = () => {
  const link = linkInput.value.trim();
  if (!link.startsWith("http")) {
    alert("Geçerli bir M3U bağlantısı girin.");
    return;
  }
  localStorage.setItem("m3uLink", link);
  linkInputContainer.style.display = "none";
  fetchM3U(link).then(() => showCanli()).catch(err => {
    listContainer.textContent = "M3U yüklenemedi: " + err.message;
  });
};

async function fetchM3U(url) {
  const res = await fetch(url);
  const text = await res.text();
  return parseM3U(text);
}

function parseM3U(data) {
  const lines = data.split('\n').map(l => l.trim()).filter(Boolean);

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('#EXTINF')) {
      const infoLine = lines[i];
      const url = lines[i + 1];
      const logoMatch = infoLine.match(/tvg-logo="([^"]+)"/);
      const nameMatch = infoLine.match(/tvg-name="([^"]+)"/) || infoLine.match(/,(.*)$/);
      const groupMatch = infoLine.match(/group-title="([^"]+)"/);
      const fullName = nameMatch ? nameMatch[1].trim() : "Bilinmeyen";
      const logo = logoMatch ? logoMatch[1] : null;

      if (url.includes('/series/')) {
        const match = fullName.match(/^(.*?)( S\d+ E\d+)?$/i);
        const seriesName = match ? match[1].trim() : fullName;
        const episode = match && match[2] ? match[2].trim() : "";

        if (!categories.Dizi[seriesName]) {
          categories.Dizi[seriesName] = [];
        }
        categories.Dizi[seriesName].push({ episode, url, logo });

      } else if (url.includes('/movie/')) {
        categories.Film.push({ name: fullName, url, logo });

      } else {
        categories.Canli.push({ name: fullName, url, logo });
      }
    }
  }
}

function clearList() {
  listContainer.innerHTML = "";
  videoEl.style.display = "none";
  videoEl.pause();
  videoEl.src = "";
}

function createChannelItem(name, url, logo) {
  const li = document.createElement("li");
  li.style.display = "flex";
  li.style.alignItems = "center";

  if (logo) {
    const img = document.createElement("img");
    img.src = logo;
    img.style.width = "40px";
    img.style.height = "auto";
    img.style.marginRight = "10px";
    li.appendChild(img);
  }

  const text = document.createTextNode(name);
  li.appendChild(text);

  li.onclick = () => {
    videoEl.src = url;
    videoEl.style.display = "block";
    videoEl.play();
  };

  return li;
}

function showCanli() {
  currentCategory = "Canli";
  clearList();

  const keyword = searchInput.value.toLowerCase();
  const filtered = categories.Canli.filter(ch =>
    ch.name.toLowerCase().includes(keyword)
  );

  const ul = document.createElement("ul");
  ul.className = "channelList";

  filtered.forEach(ch => {
    const li = createChannelItem(ch.name, ch.url, ch.logo);
    ul.appendChild(li);
  });

  listContainer.appendChild(ul);
}

function showFilm() {
  currentCategory = "Film";
  clearList();

  const keyword = searchInput.value.toLowerCase();
  const filtered = categories.Film.filter(ch =>
    ch.name.toLowerCase().includes(keyword)
  );

  const ul = document.createElement("ul");
  ul.className = "channelList";

  filtered.forEach(ch => {
    const li = createChannelItem(ch.name, ch.url, ch.logo);
    ul.appendChild(li);
  });

  listContainer.appendChild(ul);
}

function showDiziList() {
  currentCategory = "Dizi";
  clearList();

  const keyword = searchInput.value.toLowerCase();
  const seriesNames = Object.keys(categories.Dizi)
    .filter(name => name.toLowerCase().includes(keyword));

  const ul = document.createElement("ul");
  ul.className = "seriesList";

  seriesNames.forEach(name => {
    const li = document.createElement("li");
    li.textContent = name;
    li.style.cursor = "pointer";
    li.onclick = () => showEpisodes(name);
    ul.appendChild(li);
  });

  listContainer.appendChild(ul);
}

function showEpisodes(seriesName) {
  clearList();

  const backBtn = document.createElement("button");
  backBtn.textContent = "← Geri";
  backBtn.className = "backBtn";
  backBtn.onclick = showDiziList;
  listContainer.appendChild(backBtn);

  const keyword = searchInput.value.toLowerCase();
  const filteredEpisodes = categories.Dizi[seriesName].filter(ep => {
    const name = \`\${seriesName} \${ep.episode || ""}\`.toLowerCase();
    return name.includes(keyword);
  });

  const ul = document.createElement("ul");
  ul.className = "seriesEpisodes";

  filteredEpisodes.forEach(ep => {
    const name = ep.episode || seriesName;
    const li = createChannelItem(name, ep.url, ep.logo);
    ul.appendChild(li);
  });

  listContainer.appendChild(ul);
}

document.querySelectorAll('.categoryBtn').forEach(btn => {
  btn.addEventListener('click', () => {
    const cat = btn.dataset.cat;
    if (cat === 'Canli') showCanli();
    else if (cat === 'Film') showFilm();
    else if (cat === 'Dizi') showDiziList();
  });
});

searchInput.addEventListener("input", () => {
  if (currentCategory === "Canli") showCanli();
  else if (currentCategory === "Film") showFilm();
  else if (currentCategory === "Dizi") showDiziList();
});
