(function () {
  "use strict";

  const DEBOUNCE_MS = 280;
  const MIN_CHARS   = 2;

  function initSearch(inputId, dropdownId) {
    const input    = document.getElementById(inputId);
    const dropdown = document.getElementById(dropdownId);

    if (!input || !dropdown) return;

    let timer = null;

    input.addEventListener("input", () => {
      clearTimeout(timer);
      const q = input.value.trim();

      if (q.length < MIN_CHARS) {
        closeDropdown(dropdown);
        return;
      }

      timer = setTimeout(() => fetchResults(q, dropdown, input), DEBOUNCE_MS);
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && input.value.trim()) {
        e.preventDefault();
        window.location.href = `/produtos?q=${encodeURIComponent(input.value.trim())}`;
      }
      if (e.key === "Escape") closeDropdown(dropdown);
    });

    document.addEventListener("click", (e) => {
      if (!input.contains(e.target) && !dropdown.contains(e.target)) {
        closeDropdown(dropdown);
      }
    });
  }

  async function fetchResults(query, dropdown, input) {
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Network response not ok");
      const items = await res.json();
      renderDropdown(items, dropdown, query);
    } catch (_err) {
      closeDropdown(dropdown);
    }
  }

  function renderDropdown(items, dropdown, query) {
    dropdown.innerHTML = "";

    if (!items.length) {
      dropdown.innerHTML = `
        <div class="px-4 py-3 text-sm text-gray-400 text-center">
          Nenhum resultado para "<strong>${escapeHtml(query)}</strong>"
        </div>`;
    } else {
      const frag = document.createDocumentFragment();

      items.forEach((item) => {
        const el = document.createElement("a");
        el.href  = `/produto/${item.id}`;
        el.className = "flex items-center gap-3 px-4 py-3 hover:bg-forest-50 transition-colors border-b border-gray-50 last:border-0";
        el.innerHTML = `
          <img src="${escapeHtml(item.image)}"
               alt="${escapeHtml(item.name)}"
               class="w-10 h-10 rounded-lg object-cover flex-shrink-0 bg-gray-100"
               onerror="this.src='https://placehold.co/40x40/1a4a1a/fff?text=P'" />
          <div class="min-w-0 flex-1">
            <p class="text-sm font-semibold text-gray-800 truncate">${escapeHtml(item.name)}</p>
            <p class="text-xs text-forest-600 font-medium">${escapeHtml(item.price)}</p>
          </div>
        `;
        frag.appendChild(el);
      });

      const seeAll = document.createElement("a");
      seeAll.href      = `/produtos?q=${encodeURIComponent(query)}`;
      seeAll.className = "block px-4 py-2.5 text-xs text-center font-semibold text-forest-600 hover:bg-forest-50 transition-colors";
      seeAll.textContent = `Ver todos os resultados →`;
      frag.appendChild(seeAll);

      dropdown.appendChild(frag);
    }

    dropdown.classList.remove("hidden");
  }

  function closeDropdown(dropdown) {
    dropdown.classList.add("hidden");
    dropdown.innerHTML = "";
  }

  function escapeHtml(str) {
    const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
    return String(str).replace(/[&<>"']/g, (c) => map[c]);
  }

  document.addEventListener("DOMContentLoaded", () => {
    initSearch("nav-search", "search-dropdown");
    initSearch("nav-search-mobile", "search-dropdown-mobile");
  });
})();
