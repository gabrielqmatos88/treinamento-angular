// ==UserScript==
// @name         Byfood scrapper
// @namespace    http://tampermonkey.net/
// @version      2024-11-09
// @description  try to take over the world!
// @author       You
// @match        *://*.byfood.com.br/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=byfood.com.br
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  function getIdEmpresa() {
    return window.location.href.replace(/https?:\/\//, "").split(".by")[0];
  }

  function extractDeliveryTime(rootEl) {
    const deliveryEl = rootEl.querySelector('[data-target="#infos"]');
    if (!deliveryEl) {
      return "";
    }
    const text = deliveryEl.textContent;
    const match = text.match(/(\d+)\s*(min)/);
    return match ? `${match[1]} min` : "";
  }

  function extractName(rootEl) {
    return rootEl.querySelector("h1").textContent;
  }
  function extractCategory(rootEl) {
    return rootEl.querySelector(".text-center.hidden").textContent;
  }

  function extractPrice(rootEl) {
    const el = rootEl.querySelector(
      ".item-produto .label.label-danger:not(.sr-pontos)"
    );
    if (!el) {
      return null;
    }
    const text = el.textContent;
    const match = text.match(/(\d+,\d+)/);
    return match ? parseFloat(match[1].replace(",", ".")) : null;
  }

  function extractProduct(acc, [category, row, store]) {
    console.log("extract Product", [category, row]);
    const categoryId = category.textContent.trim();
    row.querySelectorAll(".item-produto-outer").forEach((el) => {
      const name = el.querySelector("h3").textContent;
      const desc = el.querySelector(".produto-descricao").textContent.trim();
      const price = extractPrice(el);
      const img_url = el.querySelector("img")?.src || "";
      acc.push({ name, category: categoryId, desc, price, store, img_url });
    });
    return acc;
  }

  function parseProducts() {
    console.log("parsing products");
    const relativeElement = document.querySelector(
      "[data-secao-categoria-index]"
    );
    if (!relativeElement) {
      return [];
    }
    const categories = Array.from(
      document.querySelectorAll("[data-secao-categoria-index]")
    );
    const productsList = Array.from(
      document.querySelectorAll(".row.ctn-list-produtos")
    );
    console.log("categories", categories);
    console.log("listProdutos", productsList);
    const store = getIdEmpresa();
    return categories
      .map((cat, i) => [cat, productsList[i], store])
      .reduce(extractProduct, []);
  }

  function DataManager() {
    let parsed = [];
    const load = () => {
      return new Promise((resolve, reject) => {
        try {
          parsed = JSON.parse(localStorage.getItem("parsed") || "[]");
          resolve(parsed);
        } catch (error) {
          console.log("failed to load");
          reject(error);
        }
      });
    };
    const loadStore = (storeId) => {
      return new Promise((resolve) => {
        try {
          const store = JSON.parse(localStorage.getItem(storeId) || "null");
          resolve(store);
        } catch (error) {
          console.log(`failed to load ${storeId}`);
          reject(error);
        }
      });
    };
    const loadAllStores = () => {
      load()
        .catch((err) => {
          console.error(err);
          return [];
        })
        .then((parsed) => {
          return Promise.all(parsed.map((storeId) => loadStore(storeId))).then(
            (stores) => stores.filter((st) => !!st)
          );
        });
    };
    const save = (id, data) => {
      localStorage.setItem(id, JSON.stringify(data));
      if (!parsed.includes(id)) {
        parsed.push(id);
        localStorage.setItem(id, JSON.stringify(parsed));
      }
    };

    return {
      save,
      saveStore: (store) => {
        save(store.id, store);
      },
      loadAllStores,
    };
  }

  function downloadJson(jsonObj, filename) {
    // Convert the object to JSON string
    const jsonString = JSON.stringify(jsonObj, null, " ");

    // Create a blob with the given JSON content and filename
    const blob = new Blob([jsonString], { type: "application/json" });
    let url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;

    // Simulate a click on the anchor element to start the download process
    a.click();
    // Revoke the blob URL after creating the download link
    window.URL.revokeObjectURL(url);
    a.remove();
  }

  function extractLogo(rootEl) {
    const img = rootEl.querySelector("img");
    if (img && img.src) {
      return img.src;
    }
    return "";
  }

  function parsePage() {
    const rootEl = document.querySelector(".logo-top-empresa");
    const empresa = {
      id: getIdEmpresa(),
      nome: extractName(rootEl),
      category: extractCategory(rootEl),
      deliveryTime: extractDeliveryTime(rootEl),
      logo: extractLogo(rootEl),
      products: parseProducts(),
    };
    downloadJson(empresa, `${empresa.id}.json`);
    console.log("empresa", empresa);
  }

  function init() {
    const btn = document.createElement("button");
    btn.innerText = "Extract";
    btn.addEventListener("click", parsePage);
    document.body.appendChild(btn);
    btn.style = "position: fixed;top: 5px;right: 30px;z-index: 50;";
  }

  setTimeout(init, 1000);
})();
