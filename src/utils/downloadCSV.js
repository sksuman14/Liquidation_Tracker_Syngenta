// src/utils/downloadCSV.js

export const downloadCSV = (records, selectedDate, filenamePrefix = "Liquidation_Report") => {
  if (!records || records.length === 0) {
    alert("No records to download");
    return;
  }

  const headers = [
    "Phone Number",
    "Employee Name",
    "HQ",
    "Zone",
    "Area",
    "Record Date",
    
    "Product Family",
    "Product Name",
    "SKU",
    "Opening Stock",
    "Liq. Qty"
  ];

  const rows = records.flatMap(record =>
    (record.products || []).map(product => [
      record.phone_number || "",
      record.employee_name || "",
      record.hq || "",
      record.zone || "",
      record.area || "",
      record.record_date || "",
      
      product.family || "",
      product.productName || product.product_name || "",
      product.sku || "",
      product.openingStock || product.opening_qty || 0,
      product.liquidationQty || product.liquidation_qty || 0
    ])
  );

  const csvContent = [
    headers.join(","),
    ...rows.map(row =>
      row
        .map(cell => {
          const value = String(cell).trim();

          // Preserve 91xxxxxxxxxx numbers exactly as text
          if (/^91\d{10}$/.test(value)) {
            return `="${value}"`;
          }

          // Escape quotes and wrap everything
          return `"${value.replace(/"/g, '""')}"`;
        })
        .join(",")
    )
  ].join("\n");

  // BOM for proper Unicode/Hindi support
  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `${filenamePrefix}_${selectedDate}.csv`
  );
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};