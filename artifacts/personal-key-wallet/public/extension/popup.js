(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);

  let vaultUrl = "";
  let currentDomain = "";

  function showToast(msg, duration = 1800) {
    const t = $("toast");
    t.textContent = msg;
    t.classList.remove("hidden");
    setTimeout(() => t.classList.add("hidden"), duration);
  }

  function copyToClipboard(text, label) {
    navigator.clipboard.writeText(text).then(() => {
      showToast(label + " copied");
    }).catch(() => {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      showToast(label + " copied");
    });
  }

  function getStrengthClass(s) {
    if (s === "strong") return "strength-strong";
    if (s === "medium") return "strength-medium";
    return "strength-weak";
  }

  function renderMatches(matches) {
    const list = $("matchList");
    list.innerHTML = "";

    matches.forEach((m) => {
      const card = document.createElement("div");
      card.className = "match-card";

      const faviconUrl = m.url
        ? `https://www.google.com/s2/favicons?domain=${m.url}&sz=32`
        : null;

      const avatarHtml = faviconUrl
        ? `<img class="match-favicon" src="${faviconUrl}" alt="${m.title}"
             onerror="this.style.display='none';this.nextSibling.style.display='flex'">
           <div class="match-favicon-fallback" style="display:none">${m.title.charAt(0)}</div>`
        : `<div class="match-favicon-fallback">${m.title.charAt(0)}</div>`;

      card.innerHTML = `
        <div class="match-top">
          ${avatarHtml}
          <div class="match-info">
            <div class="match-title">${escHtml(m.title)}</div>
            <div class="match-username">${escHtml(m.username)}</div>
          </div>
          <span class="strength-pill ${getStrengthClass(m.strength)}">${m.strength}</span>
        </div>
        <div class="match-actions">
          <button class="copy-btn" data-type="username" data-val="${escAttr(m.username)}">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
            Copy Username
          </button>
          <button class="copy-btn" data-type="password" data-val="${escAttr(m.password)}">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            Copy Password
          </button>
        </div>
      `;

      list.appendChild(card);
    });

    list.querySelectorAll(".copy-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        const val = this.dataset.val;
        const type = this.dataset.type;
        copyToClipboard(val, type === "username" ? "Username" : "Password");
        this.classList.add("copied");
        setTimeout(() => this.classList.remove("copied"), 1500);
      });
    });

    list.classList.remove("hidden");
  }

  function escHtml(str) {
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function escAttr(str) {
    return String(str).replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  async function loadMatches(domain) {
    $("loadingState").classList.remove("hidden");
    $("emptyState").classList.add("hidden");
    $("matchList").classList.add("hidden");

    try {
      const url = `${vaultUrl}/api/passwords/match?domain=${encodeURIComponent(domain)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("API error " + res.status);
      const data = await res.json();
      $("loadingState").classList.add("hidden");

      if (!data || data.length === 0) {
        $("emptyState").classList.remove("hidden");
      } else {
        renderMatches(data);
      }
    } catch (e) {
      $("loadingState").classList.add("hidden");
      $("emptyState").classList.remove("hidden");
    }
  }

  function showSetup() {
    $("setupView").classList.remove("hidden");
    $("mainView").classList.add("hidden");
    const saved = vaultUrl || "";
    $("apiUrlInput").value = saved;
  }

  function showMain() {
    $("setupView").classList.add("hidden");
    $("mainView").classList.remove("hidden");
    $("openVaultLink").href = vaultUrl + "/vault/passwords";
    $("addNewLink").href = vaultUrl + "/vault/passwords";
  }

  $("settingsBtn").addEventListener("click", () => {
    if ($("setupView").classList.contains("hidden")) {
      showSetup();
    } else {
      if (vaultUrl) showMain();
    }
  });

  $("saveUrlBtn").addEventListener("click", () => {
    let url = $("apiUrlInput").value.trim().replace(/\/$/, "");
    if (!url) return;
    if (!url.startsWith("http")) url = "https://" + url;
    vaultUrl = url;
    chrome.storage.local.set({ vaultUrl: url }, () => {
      showMain();
      if (currentDomain) {
        $("currentDomain").textContent = currentDomain;
        loadMatches(currentDomain);
      }
    });
  });

  chrome.storage.local.get(["vaultUrl"], (result) => {
    vaultUrl = result.vaultUrl || "";

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab && tab.url) {
        try {
          const parsed = new URL(tab.url);
          currentDomain = parsed.hostname.replace(/^www\./, "");
        } catch (e) {
          currentDomain = "";
        }
      }

      if (!vaultUrl) {
        showSetup();
        return;
      }

      showMain();
      if (currentDomain) {
        $("currentDomain").textContent = currentDomain;
        loadMatches(currentDomain);
      } else {
        $("currentDomain").textContent = "No active page";
        $("emptyState").classList.remove("hidden");
      }
    });
  });
})();
