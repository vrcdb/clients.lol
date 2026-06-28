const apiModal = document.getElementById("api-modal");
const apiUsage = document.getElementById("api-usage");
const tools = document.getElementById("tools");
const toolsModal = document.getElementById("tools-modal");
const search = document.getElementById("search");
const statusFilter = document.getElementById("status-filter");
const accessFilter = document.getElementById("access-filter");
const osFilter = document.getElementById("os-filter");
const featureFilter = document.getElementById("feature-filter");
const table = document.getElementById("clients-table");
const tbody = table.querySelector("tbody");
const resultCount = document.getElementById("result-count");
const totalRows = tbody.querySelectorAll(".client-row").length;
const noColumn = -1;
const oneRow = 1;

let currentSort = { column: noColumn, direction: "asc" };

function setupDialog(button, dialog) {
  button.addEventListener("click", () => {
    dialog.showModal();
  });

  const closeDialog = () => {
    dialog.close();
  };

  dialog.querySelector("[data-modal-close]").addEventListener("click", closeDialog);
  dialog.addEventListener("cancel", closeDialog);
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      closeDialog();
    }
  });
}

setupDialog(apiUsage, apiModal);
setupDialog(tools, toolsModal);

function getQueryParams() {
  return new URLSearchParams(window.location.search);
}

function updateQueryParams(updates) {
  const params = getQueryParams();
  for (const [key, value] of Object.entries(updates)) {
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
  }
  let newPath = window.location.pathname;
  if (params.toString()) {
    newPath = `${window.location.pathname}?${params.toString()}`;
  }
  window.history.pushState({}, "", newPath);
}

function getPairs() {
  return Array.from(tbody.querySelectorAll(".client-row")).map((row) => ({
    detail: row.nextElementSibling,
    row,
  }));
}

function getCellValue(row, sortableIndex) {
  const header = document.querySelectorAll("th.sortable")[sortableIndex];
  const cellIndex = header ? parseInt(header.dataset.cell, 10) : sortableIndex;
  return row.cells[cellIndex]?.textContent?.trim() || "";
}

function rowMatches(row, query) {
  const status = statusFilter.value;
  const access = accessFilter.value;
  const os = osFilter.value;
  const feature = featureFilter.value;

  return (
    (!query || row.dataset.search.includes(query)) &&
    (!status || row.dataset.status === status) &&
    (!access || row.dataset.access === access) &&
    (!os || row.dataset.os === os) &&
    (!feature || row.dataset[feature] === "true")
  );
}

function applyFilters(shouldUpdateURL = true) {
  const query = search.value.trim().toLowerCase();
  let visibleRows = 0;

  getPairs().forEach(({ row, detail }) => {
    const visible = rowMatches(row, query);
    row.hidden = !visible;
    if (!visible) {
      row.setAttribute("aria-expanded", "false");
      detail.hidden = true;
    } else if (row.getAttribute("aria-expanded") === "true") {
      detail.hidden = false;
    } else {
      detail.hidden = true;
    }
    if (visible) {
      visibleRows += oneRow;
    }
  });

  resultCount.textContent = `Showing ${visibleRows} of ${totalRows}`;

  if (shouldUpdateURL) {
    updateQueryParams({
      access: accessFilter.value || null,
      feature: featureFilter.value || null,
      os: osFilter.value || null,
      search: query || null,
      status: statusFilter.value || null,
    });
  }
}

function setSortState(column, direction, shouldUpdateURL = true) {
  const header = document.querySelectorAll("th.sortable")[column];
  if (!header) {
    return;
  }

  currentSort = { column, direction };
  if (shouldUpdateURL) {
    updateQueryParams({
      order: direction,
      sort: header.dataset.column,
    });
  }

  const pairs = getPairs();
  pairs.sort((first, second) => {
    const aValue = getCellValue(first.row, column);
    const bValue = getCellValue(second.row, column);
    const comparison = aValue.localeCompare(bValue);
    if (direction === "asc") {
      return comparison;
    }
    return -comparison;
  });

  pairs.forEach(({ row, detail }) => {
    tbody.appendChild(row);
    tbody.appendChild(detail);
  });

  document.querySelectorAll("th.sortable").forEach((th, index) => {
    const indicator = th.querySelector(".sort-indicator");
    const active = index === column;
    let indicatorText = "";
    let ariaSort = "none";

    if (active && direction === "asc") {
      indicatorText = "↑";
      ariaSort = "ascending";
    } else if (active) {
      indicatorText = "↓";
      ariaSort = "descending";
    }

    indicator.textContent = indicatorText;
    th.setAttribute("aria-sort", ariaSort);
  });
}

function clearSortState() {
  currentSort = { column: noColumn, direction: "asc" };
  document.querySelectorAll("th.sortable").forEach((th) => {
    th.querySelector(".sort-indicator").textContent = "";
    th.setAttribute("aria-sort", "none");
  });
}

function getColumnIndexByUrlName(name) {
  return Array.from(document.querySelectorAll("th.sortable")).findIndex(
    (header) => header.dataset.column === name,
  );
}

function toggleRow(row) {
  const detail = row.nextElementSibling;
  const expanded = row.getAttribute("aria-expanded") === "true";

  row.setAttribute("aria-expanded", String(!expanded));
  detail.hidden = expanded || row.hidden;
}

[search, statusFilter, accessFilter, osFilter, featureFilter].forEach((control) => {
  control.addEventListener("input", () => applyFilters());
});

document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === "k") {
    event.preventDefault();
    search.focus();
  }
});

search.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    search.value = "";
    applyFilters();
    search.blur();
  }
});

document.querySelectorAll(".client-row").forEach((row) => {
  row.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      return;
    }
    toggleRow(row);
  });
  row.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleRow(row);
    }
  });
});

document.querySelectorAll("th.sortable").forEach((header, index) => {
  header.setAttribute("aria-sort", "none");
  header.querySelector("button").addEventListener("click", () => {
    let direction = "asc";
    if (currentSort.column === index && currentSort.direction === "asc") {
      direction = "desc";
    }
    setSortState(index, direction);
  });
});

function initializeFromURL() {
  const params = getQueryParams();

  search.value = params.get("search") || "";
  statusFilter.value = params.get("status") || "";
  accessFilter.value = params.get("access") || "";
  osFilter.value = params.get("os") || "";
  featureFilter.value = params.get("feature") || "";
  applyFilters(false);

  const columnName = params.get("sort");
  if (columnName) {
    const columnIndex = getColumnIndexByUrlName(columnName);
    if (columnIndex !== noColumn) {
      setSortState(columnIndex, params.get("order") || "asc", false);
    }
  } else {
    clearSortState();
  }
}

document.addEventListener("DOMContentLoaded", initializeFromURL);
window.addEventListener("popstate", initializeFromURL);
