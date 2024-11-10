const fs = require("fs");
const path = require("path");

function saveJsonFile(filename, obj) {
  fs.writeFileSync(`./${filename}`, JSON.stringify(obj, null, 2), "utf-8");
}

function readJsonFiles() {
  const allStores = [];
  let allProducts = [];
  let productsMatrix = [];
  const files = fs.readdirSync("./");
  files.forEach((file) => {
    if (file.endsWith(".json")) {
      try {
        const content = fs.readFileSync(path.join(__dirname, file));
        const tmp = JSON.parse(content);
        if (!tmp || !tmp.id) {
          return;
        }
        const { id, nome, category, deliveryTime, products, logo } = tmp;
        allStores.push({ id, nome, category, deliveryTime, logo });
        allProducts = [...allProducts, ...products];
        productsMatrix.push(products);
      } catch (error) {
        console.error(error);
      }
    }
  });

  console.log(
    `combining ${allStores.length} store files in a single file with ${allProducts.length} products`
  );
  allStores.forEach((store, i) =>
    console.log(
      `${i + 1}) ${store.id} (${productsMatrix[i].length} product(s))`
    )
  );
  saveJsonFile("data.json", {
    stores: allStores,
    products: allProducts,
  });
}

readJsonFiles();
