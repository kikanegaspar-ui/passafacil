(function () {
  "use strict";

  window.toggleProduct = async function (productId, btn) {
    btn.disabled = true;

    try {
      const res = await fetch(`/vendedor/produto/${productId}/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) throw new Error("Server error");

      const data = await res.json();

      if (data.ok) {
        const isActive = data.is_active;
        const dot      = btn.querySelector("span");

        btn.classList.toggle("bg-green-500", isActive);
        btn.classList.toggle("bg-gray-300", !isActive);

        dot.classList.toggle("translate-x-6", isActive);
        dot.classList.toggle("translate-x-1", !isActive);

        btn.dataset.active = isActive.toString();
        btn.title = isActive ? "Desactivar" : "Activar";
      }
    } catch (_err) {
      showToast("Erro ao actualizar o estado.", "error");
    } finally {
      btn.disabled = false;
    }
  };

  let pendingDeleteId = null;

  window.deleteProduct = function (productId, productName) {
    pendingDeleteId = productId;
    document.getElementById("delete-modal-text").textContent =
      `Tem a certeza que deseja eliminar "${productName}"? Esta acção não pode ser revertida.`;
    document.getElementById("delete-modal").classList.remove("hidden");
    document.getElementById("delete-modal").classList.add("flex");
  };

  window.closeDeleteModal = function () {
    pendingDeleteId = null;
    document.getElementById("delete-modal").classList.add("hidden");
    document.getElementById("delete-modal").classList.remove("flex");
  };

  document.addEventListener("DOMContentLoaded", () => {
    const confirmBtn = document.getElementById("confirm-delete-btn");
    if (!confirmBtn) return;

    confirmBtn.addEventListener("click", async () => {
      if (!pendingDeleteId) return;

      confirmBtn.disabled = true;
      confirmBtn.textContent = "A eliminar…";

      try {
        const res = await fetch(`/vendedor/produto/${pendingDeleteId}/eliminar`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        const data = await res.json();

        if (data.ok) {
          const row = document.getElementById(`row-${pendingDeleteId}`);
          if (row) {
            row.style.transition = "opacity .3s ease, transform .3s ease";
            row.style.opacity    = "0";
            row.style.transform  = "translateX(-10px)";
            setTimeout(() => row.remove(), 320);
          }
          closeDeleteModal();
          showToast(data.message, "success");
        } else {
          showToast(data.message || "Erro ao eliminar.", "error");
        }
      } catch (_err) {
        showToast("Erro de ligação. Tente novamente.", "error");
      } finally {
        confirmBtn.disabled = false;
        confirmBtn.textContent = "Eliminar";
      }
    });

    document.getElementById("delete-modal").addEventListener("click", (e) => {
      if (e.target === e.currentTarget) closeDeleteModal();
    });
  });

  function showToast(message, type = "info") {
    const colours = {
      success: "bg-green-600",
      error:   "bg-red-500",
      info:    "bg-forest-600",
    };

    const toast = document.createElement("div");
    toast.className = `fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] px-6 py-3
      text-white text-sm font-semibold rounded-full shadow-xl
      ${colours[type] || colours.info}
      transition-all duration-300 opacity-0 translate-y-2`;
    toast.textContent = message;

    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.opacity   = "1";
      toast.style.transform = "translateX(-50%) translateY(0)";
    });

    setTimeout(() => {
      toast.style.opacity   = "0";
      toast.style.transform = "translateX(-50%) translateY(8px)";
      setTimeout(() => toast.remove(), 350);
    }, 3200);
  }
})();
