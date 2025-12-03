// -----------------------------------------
// MASTER DUMMY DATA (Single Source of Truth)
// -----------------------------------------
export let liquidationData = [
  {
    id: 1,
    name: "Ramesh",
    area: "Mumbai",
    productFamily: "PBS",
    productName: "SWEET",
    sku: "1 L",
    openingQty: 150,
    liquidationQty: 50,
    status: "TA",
  },
  {
    id: 2,
    name: "Suresh",
    area: "Pune",
    productFamily: "MIC",
    productName: "CALBIT C",
    sku: "5 L",
    openingQty: 40,
    liquidationQty: 10,
    status: "TA",
  },
  {
    id: 3,
    name: "Mahesh",
    area: "Delhi",
    productFamily: "BIOF",
    productName: "Hyoro MY+",
    sku: "4 KG",
    openingQty: 25,
    liquidationQty: 12,
    status: "TA",
  },
];

// -----------------------------------------
// MOVE TO NEXT APPROVAL STAGE
// -----------------------------------------
export function moveToNextStage(id) {
  const order = ["TA", "TSM", "AM", "ZM", "NSM", "CM", "FINAL"];

  liquidationData = liquidationData.map(item => {
    if (item.id === id) {
      const currentIndex = order.indexOf(item.status);
      return { ...item, status: order[currentIndex + 1] };
    }
    return item;
  });
}
