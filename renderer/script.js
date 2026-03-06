// Supply Office Inventory System - JavaScript

// Data storage
let inventory = [];
let transactions = [];

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    initializeForms();
    updateDateTime();
    setInterval(updateDateTime, 1000);
    renderInventory();
    renderTransactions();
    populateReduceItemSelect();
    updateStatistics();
});

// Load data from localStorage
function loadData() {
    try {
        const savedInventory = localStorage.getItem('medicalInventory');
        const savedTransactions = localStorage.getItem('medicalTransactions');
        
        if (savedInventory) {
            inventory = JSON.parse(savedInventory);
        }
        
        if (savedTransactions) {
            transactions = JSON.parse(savedTransactions);
        }
        
        console.log('Data loaded from localStorage');
    } catch (error) {
        console.error('Error loading data:', error);
        showNotification('Error loading saved data', 'error');
    }
}

// Save data — debounced so it never blocks the UI thread
const MAX_TRANSACTIONS = 500;
let _saveTimer = null;
function saveData() {
    clearTimeout(_saveTimer);
    _saveTimer = setTimeout(() => {
        try {
            if (transactions.length > MAX_TRANSACTIONS) transactions = transactions.slice(0, MAX_TRANSACTIONS);
            localStorage.setItem('medicalInventory',    JSON.stringify(inventory));
            localStorage.setItem('medicalTransactions', JSON.stringify(transactions));
        } catch (error) {
            console.error('Error saving data:', error);
            showNotification('Error saving data', 'error');
        }
    }, 400);
}

// Initialize forms
function initializeForms() {
    const addItemForm   = document.getElementById('addItemForm');
    const searchInput   = document.getElementById('reduceItemSearch');
    const searchResults = document.getElementById('searchResults');

    addItemForm.addEventListener('submit', handleAddItem);
    searchInput.addEventListener('focus', () => showSearchResults());
    searchInput.addEventListener('input', debounce(function() { filterSearchResults(this.value); }, 200));

    document.addEventListener('click', function(e) {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target))
            searchResults.classList.remove('show');
        const rInput = document.getElementById('recipientSearch');
        const rResults = document.getElementById('recipientResults');
        if (rInput && rResults && !rInput.contains(e.target) && !rResults.contains(e.target))
            rResults.classList.remove('show');
    });

    const recipientInput = document.getElementById('recipientSearch');
    recipientInput.addEventListener('focus', function() { showRecipientResults(this.value); });
    recipientInput.addEventListener('input', debounce(function() {
        showRecipientResults(this.value);
        document.getElementById('recipient').value = this.value.trim();
    }, 200));
}

// Update date and time
function updateDateTime() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };
    document.getElementById('currentDate').textContent = now.toLocaleDateString('en-US', options);
}

// Handle add item form submission
function handleAddItem(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const newItem = {
        id: Date.now(),
        name: formData.get('itemName'),
        description: formData.get('description') || '',
        sourceOfFunds: formData.get('sourceOfFunds') || '',
        poNumber: formData.get('poNumber') || '',
        dateDelivered: formData.get('dateDelivered') || null,
        category: formData.get('category'),
        quantity: parseInt(formData.get('quantity')),
        unit: formData.get('unit'),
        minQuantity: parseInt(formData.get('minQuantity')),
        expiryDate: formData.get('expiryDate') || null,
        location: formData.get('location'),
        createdAt: new Date().toISOString()
    };
    
    inventory.push(newItem);
    
    // Record transaction
    const transaction = {
        id: Date.now(),
        itemId: newItem.id,
        itemName: newItem.name,
        type: 'add',
        quantity: newItem.quantity,
        recipient: 'Supply Office',
        purpose: 'Initial Stock',
        notes: 'New item added to inventory',
        timestamp: new Date().toISOString()
    };
    
    transactions.unshift(transaction);
    
    saveData();
    renderInventory();
    renderTransactions();
    populateReduceItemSelect();
    updateStatistics();
    
    e.target.reset();
    showNotification('Item added successfully!', 'success');
}

// ── Staged reduction list ──
let reduceList = [];

function addToReduceList() {
    const itemId   = parseInt(document.getElementById('reduceItemId').value);
    const itemName = document.getElementById('reduceItemSearch').value.trim();
    const quantity = parseInt(document.getElementById('reduceQuantity').value);
    const recipient = document.getElementById('recipient').value.trim();
    const receivedBy = document.getElementById('receivedBy').value.trim();
    const purpose  = document.getElementById('purpose').value.trim();
    const notes    = document.getElementById('notes').value.trim();
    const txnDateVal = document.getElementById('transactionDate').value;
    const txnTimestamp = txnDateVal ? new Date(txnDateVal).toISOString() : new Date().toISOString();

    if (!itemId || !itemName) { showNotification('Please select an item!', 'error'); return; }
    if (!quantity || quantity < 1) { showNotification('Please enter a valid quantity!', 'error'); return; }
    if (!recipient) { showNotification('Please enter a recipient!', 'error'); return; }

    const itemIndex = inventory.findIndex(i => i.id === itemId);
    if (itemIndex === -1) { showNotification('Item not found!', 'error'); return; }

    // Check available quantity accounting for already-staged reductions
    const alreadyStaged = reduceList
        .filter(e => e.itemId === itemId)
        .reduce((sum, e) => sum + e.quantity, 0);
    const available = inventory[itemIndex].quantity - alreadyStaged;

    if (quantity > available) {
        showNotification(`Only ${available} ${inventory[itemIndex].unit} available (${alreadyStaged} already staged)!`, 'error');
        return;
    }

    reduceList.push({ itemId, itemName, quantity, unit: inventory[itemIndex].unit, recipient, receivedBy, purpose, notes, txnTimestamp });
    renderReduceList();

    // Reset only item/qty fields; keep recipient, purpose, notes for convenience
    document.getElementById('reduceItemSearch').value = '';
    document.getElementById('reduceItemId').value = '';
    document.getElementById('reduceQuantity').value = '';
    document.getElementById('searchResults').classList.remove('show');
    showNotification(`"${itemName}" added to list!`, 'success');
}

function renderReduceList() {
    const panel = document.getElementById('reduceReviewPanel');
    const container = document.getElementById('reduceListItems');

    if (reduceList.length === 0) {
        panel.style.display = 'none';
        return;
    }

    panel.style.display = 'block';
    container.innerHTML = reduceList.map((entry, idx) => `
        <div style="display:flex; align-items:center; justify-content:space-between; padding:10px 14px; border-bottom:1px solid #e2e8f0; background:${idx % 2 === 0 ? '#fff' : '#f8fafc'};">
            <div style="flex:1;">
                <div style="font-weight:600; font-size:14px; color:#1a1a2e;">${entry.itemName}</div>
                <div style="font-size:12px; color:#64748b; margin-top:2px;">
                    Qty: <strong style="color:#e74c3c;">-${entry.quantity} ${entry.unit}</strong>
                    &nbsp;·&nbsp; To: ${entry.recipient}
                    ${entry.purpose ? `&nbsp;·&nbsp; ${entry.purpose}` : ''}
                    ${entry.notes ? `<br><span style="font-style:italic;">${entry.notes}</span>` : ''}
                </div>
            </div>
            <button onclick="removeFromReduceList(${idx})" style="background:none; border:none; color:#e74c3c; font-size:18px; cursor:pointer; padding:0 4px; line-height:1;" title="Remove">✕</button>
        </div>
    `).join('');
}

function removeFromReduceList(idx) {
    const removed = reduceList.splice(idx, 1)[0];
    renderReduceList();
    showNotification(`"${removed.itemName}" removed from list.`, 'info');
}

function clearReduceList() {
    reduceList = [];
    renderReduceList();
}

function confirmReduceList() {
    if (reduceList.length === 0) { showNotification('No items to reduce!', 'error'); return; }

    const printReceipts = [];
    const receiptTimestamp = reduceList[0].txnTimestamp;

    reduceList.forEach(entry => {
        const itemIndex = inventory.findIndex(i => i.id === entry.itemId);
        if (itemIndex === -1) return;

        inventory[itemIndex].quantity -= entry.quantity;

        const transaction = {
            id: Date.now() + Math.random(),
            itemId: entry.itemId,
            itemName: entry.itemName,
            type: 'reduce',
            quantity: entry.quantity,
            recipient: entry.recipient,
            receivedBy: entry.receivedBy || '',
            purpose: entry.purpose,
            notes: entry.notes,
            timestamp: entry.txnTimestamp
        };
        transactions.unshift(transaction);

        printReceipts.push({
            itemName: entry.itemName,
            category: inventory[itemIndex].category,
            quantity: entry.quantity,
            unit: entry.unit,
            description: inventory[itemIndex].description || ''
        });
    });

    saveData();
    renderInventory();
    renderTransactions();
    populateReduceItemSelect();
    updateStatistics();

    // Always print one receipt for the whole cart
    if (printReceipts.length > 0) {
        const first = reduceList[0];
        generateAcknowledgementReceipt({
            recipient: first.recipient,
            receivedBy: first.receivedBy || '',
            purpose: first.purpose,
            notes: first.notes,
            timestamp: receiptTimestamp,
            items: printReceipts
        });
    }

    clearReduceList();
    clearReduceForm();

    showNotification('Items reduced successfully! Receipt opened.', 'success');
}

// ── Pagination state ─────────────────────────────────────────────────────────
const INV_PAGE_SIZE = 50;
let invCurrentPage  = 1;
let invFilteredList = null;

function buildItemRow(item) {
    const rowClass = item.quantity === 0 ? 'critical-stock' :
                     item.quantity <= item.minQuantity ? 'low-stock' : '';
    let badgeClass = 'badge-good', badgeLabel = 'Good';
    if (item.quantity === 0)                    { badgeClass = 'badge-critical'; badgeLabel = 'Out of Stock'; }
    else if (item.quantity <= item.minQuantity) { badgeClass = 'badge-low';      badgeLabel = 'Low Stock'; }
    const stockBadge = `<span class="stock-badge ${badgeClass}"><span class="dot"></span>${badgeLabel}</span>`;

    const dash = '<span style="color:#cbd5e1;">—</span>';
    let expiryDisplay = item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : dash;
    let expiryClass = '';
    if (item.expiryDate) {
        const days = Math.floor((new Date(item.expiryDate) - new Date()) / 86400000);
        if (days < 0) {
            expiryDisplay = `<span style="color:#e74c3c;font-weight:700;font-size:11px;background:#fee2e2;padding:2px 6px;border-radius:4px;">EXPIRED</span>`;
            expiryClass = 'critical-stock';
        } else if (days <= 30) {
            expiryDisplay = `<span style="color:#d97706;font-weight:600;">${new Date(item.expiryDate).toLocaleDateString()}</span>`;
            expiryClass = 'low-stock';
        }
    }

    // Clicking anywhere on the row (except action buttons) opens details
    return `<tr class="inv-row ${rowClass} ${expiryClass}" onclick="viewItemDetails(${item.id})" title="Click to view details">
        <td>${item.name}</td>
        <td style="color:#64748b;font-size:12px;">${item.description||dash}</td>
        <td style="font-size:12px;">${item.sourceOfFunds||dash}</td>
        <td style="font-size:12px;">${item.poNumber||dash}</td>
        <td style="font-size:12px;">${item.dateDelivered?new Date(item.dateDelivered).toLocaleDateString():dash}</td>
        <td><span class="category-chip" title="${item.category}">${item.category}</span></td>
        <td><span class="qty-pill">${item.quantity}<span class="unit-label">${item.unit}</span></span></td>
        <td style="color:#94a3b8;font-size:12px;">${item.minQuantity} ${item.unit}</td>
        <td>${expiryDisplay}</td>
        <td>${stockBadge}</td>
        <td style="font-size:12px;color:#475569;">${item.location||dash}</td>
        <td style="font-size:12px;color:#94a3b8;">${new Date(item.createdAt).toLocaleDateString()}</td>
        <td class="action-buttons" onclick="event.stopPropagation()">
            <button class="inv-action-btn inv-btn-details" onclick="viewItemDetails(${item.id})">Details</button>
            <button class="inv-action-btn inv-btn-edit"    onclick="openEditModal(${item.id})">Edit</button>
            <button class="inv-action-btn inv-btn-delete"  onclick="deleteItem(${item.id})">Delete</button>
        </td>
    </tr>`;
}

// Render only the current page
function renderInventory() {
    const tbody = document.getElementById('inventoryTableBody');
    const badge = document.getElementById('invCountBadge');
    if (badge) badge.textContent = inventory.length;

    const source = invFilteredList !== null ? invFilteredList : inventory;

    if (source.length === 0) {
        tbody.innerHTML = `<tr><td colspan="13"><div class="inv-empty-state">
            <div class="empty-icon">📦</div>
            <p>${invFilteredList !== null ? 'No items match your search.' : 'No items in inventory. Add items using the form above.'}</p>
        </div></td></tr>`;
        renderPagination(0, 0);
        return;
    }

    const totalPages = Math.ceil(source.length / INV_PAGE_SIZE);
    if (invCurrentPage > totalPages) invCurrentPage = totalPages;
    const start     = (invCurrentPage - 1) * INV_PAGE_SIZE;
    const pageItems = source.slice(start, start + INV_PAGE_SIZE);

    requestAnimationFrame(() => {
        tbody.innerHTML = pageItems.map(buildItemRow).join('');
        renderPagination(totalPages, source.length);
    });
}

function renderPagination(totalPages, totalCount) {
    const ctrl = document.getElementById('invPaginationControls');
    if (!ctrl) return;
    if (totalPages <= 1) { ctrl.innerHTML = ''; return; }
    const start = (invCurrentPage - 1) * INV_PAGE_SIZE + 1;
    const end   = Math.min(invCurrentPage * INV_PAGE_SIZE, totalCount);
    const range = 2;
    let html = `<div class="pagination-info">Showing ${start}–${end} of ${totalCount} items</div><div class="pagination-btns">`;
    html += `<button class="pg-btn" onclick="goToInvPage(1)" ${invCurrentPage===1?'disabled':''}>«</button>`;
    html += `<button class="pg-btn" onclick="goToInvPage(${invCurrentPage-1})" ${invCurrentPage===1?'disabled':''}>‹ Prev</button>`;
    for (let p = Math.max(1,invCurrentPage-range); p<=Math.min(totalPages,invCurrentPage+range); p++) {
        html += `<button class="pg-btn ${p===invCurrentPage?'pg-active':''}" onclick="goToInvPage(${p})">${p}</button>`;
    }
    html += `<button class="pg-btn" onclick="goToInvPage(${invCurrentPage+1})" ${invCurrentPage===totalPages?'disabled':''}>Next ›</button>`;
    html += `<button class="pg-btn" onclick="goToInvPage(${totalPages})" ${invCurrentPage===totalPages?'disabled':''}>»</button>`;
    html += `</div>`;
    ctrl.innerHTML = html;
}

function goToInvPage(page) {
    invCurrentPage = page;
    renderInventory();
    const card = document.getElementById('inventoryTableBody').closest('.card');
    if (card) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Get stock status
function getStockStatus(item) {
    if (item.quantity === 0) return 'Out of Stock';
    if (item.quantity <= item.minQuantity) return 'Low Stock';
    return 'Good';
}

// Get stock indicator class
function getStockClass(item) {
    if (item.quantity === 0) return 'stock-critical';
    if (item.quantity <= item.minQuantity) return 'stock-low';
    return 'stock-good';
}

// Render transactions
function renderTransactions() {
    const tbody = document.getElementById('transactionTableBody');
    
    if (transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 30px;">No transactions recorded yet.</td></tr>';
        return;
    }
    
    const recentTransactions = transactions.slice(0, 20);
    
    tbody.innerHTML = recentTransactions.map(transaction => {
        const rowClass = transaction.type === 'add' ? 'add-transaction' : 'reduce-transaction';
        const typeSymbol = transaction.type === 'add' ? '+' : '-';
        
        // Only show print button for reduce transactions
        const actionButtons = transaction.type === 'reduce' 
            ? `<button class="action-btn" onclick="printTransactionReceipt(${transaction.id})" title="Print receipt">📄 Print</button>
               <button class="action-btn btn-danger" onclick="deleteTransaction(${transaction.id})" title="Delete transaction">Delete</button>`
            : `<button class="action-btn btn-danger" onclick="deleteTransaction(${transaction.id})" title="Delete transaction">Delete</button>`;
        
        return `
            <tr class="${rowClass}">
                <td>${new Date(transaction.timestamp).toLocaleString()}</td>
                <td>${transaction.itemName}</td>
                <td>${typeSymbol}${transaction.quantity}</td>
                <td>${transaction.recipient}</td>
                <td>${transaction.purpose}</td>
                <td>${transaction.notes}</td>
                <td class="action-buttons">
                    ${actionButtons}
                </td>
            </tr>
        `;
    }).join('');
}

// Show search results
function showSearchResults(searchTerm = '') {
    const searchResults = document.getElementById('searchResults');
    
    if (inventory.length === 0) {
        searchResults.innerHTML = '<div class="no-results">No items in inventory</div>';
        searchResults.classList.add('show');
        return;
    }
    
    let filteredItems = inventory;
    
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filteredItems = inventory.filter(item => 
            item.name.toLowerCase().includes(term) ||
            item.category.toLowerCase().includes(term) ||
            (item.description && item.description.toLowerCase().includes(term)) ||
            (item.location && item.location.toLowerCase().includes(term))
        );
    }
    
    if (filteredItems.length === 0) {
        searchResults.innerHTML = '<div class="no-results">No items found matching your search</div>';
        searchResults.classList.add('show');
        return;
    }
    
    searchResults.innerHTML = filteredItems.map(item => {
        const stockStatus = item.quantity === 0 ? 'âš ï¸ Out of Stock' : 
                           item.quantity <= item.minQuantity ? 'âš ï¸ Low Stock' : 
                           `${item.quantity} ${item.unit} available`;
        
        return `
            <div class="search-result-item" onclick="selectItem(${item.id}, '${item.name.replace(/'/g, "\\'")}')">
                <div class="search-result-name">${item.name}</div>
                <div class="search-result-details">
                    ${item.category}${item.location ? ' â€¢ ' + item.location : ''}
                </div>
                <div class="search-result-stock">${stockStatus}</div>
            </div>
        `;
    }).join('');
    
    searchResults.classList.add('show');
}

// Filter search results
function filterSearchResults(searchTerm) {
    showSearchResults(searchTerm);
}

// Select item from search results
function selectItem(itemId, itemName) {
    document.getElementById('reduceItemSearch').value = itemName;
    document.getElementById('reduceItemId').value = itemId;
    document.getElementById('searchResults').classList.remove('show');
    
    // Focus on next input
    document.getElementById('reduceQuantity').focus();
}

// Populate reduce item select (kept for backward compatibility, but now updates search)
function populateReduceItemSelect() {
    // This function is called after inventory updates
    // If search is currently visible, refresh it
    const searchInput = document.getElementById('reduceItemSearch');
    if (searchInput && searchInput === document.activeElement) {
        showSearchResults(searchInput.value);
    }
}

// ── Recipient / Department searchable dropdown ──────────────────────────────
const RECIPIENT_OPTIONS = [
    'CHO/ACHO',
    'ANIMAL BITE TREATMENT CENTER & XRAY',
    'MENTAL HEALTH',
    'CESU',
    'PHARMACY',
    'RHWC',
    'PUBLIC HEALTH PLANNING',
    'HEALTH PROMOTION DIVISION',
    'LABORATORY DIVISION',
    'ADMINISTRATIVE',
    'ADMINISTRATIVE – Personnel',
    'ADMINISTRATIVE – Finance',
    'ADMINISTRATIVE – Records',
    'ADMINISTRATIVE – Supply',
    'ADMINISTRATIVE – Building Maintenance',
    'ADMINISTRATIVE – Information Technology',
    'ADMINISTRATIVE – Transportation',
    'CITY HALL CLINIC/EMS',
    'DENTAL',
    'SANITATION',
    'NUTRITION',
    'POPULATION',
    'ASIN',
    'ATAB',
    'ATOK TRAIL',
    'AURORA HILL',
    'CAMPO FILIPINO',
    'CITY CAMP',
    "ENGINEER'S HILL",
    'IRISAN',
    'LOAKAN',
    'LUCBAN',
    'MINES VIEW',
    'PACDAL',
    'PINSAO',
    'QUEZON HILL',
    'QUIRINO HILL',
    'SCOUT BARRIO'
];

function showRecipientResults(term) {
    const recipientResults = document.getElementById('recipientResults');
    const q = (term || '').trim().toLowerCase();
    const filtered = q
        ? RECIPIENT_OPTIONS.filter(o => o.toLowerCase().includes(q))
        : RECIPIENT_OPTIONS;

    if (filtered.length === 0) {
        recipientResults.innerHTML = '<div class="no-results">No matching department found</div>';
    } else {
        recipientResults.innerHTML = filtered.map(opt =>
            `<div class="search-result-item" onclick="selectRecipient('${opt.replace(/'/g, "\\'")}')">`+
            `<div class="search-result-name">${opt}</div></div>`
        ).join('');
    }
    recipientResults.classList.add('show');
}

function selectRecipient(value) {
    document.getElementById('recipientSearch').value = value;
    document.getElementById('recipient').value = value;
    document.getElementById('recipientResults').classList.remove('show');
    document.getElementById('purpose').focus();
}
// ────────────────────────────────────────────────────────────────────────────

// Update statistics
function updateStatistics() {
    document.getElementById('totalItems').textContent = inventory.length;
    
    const totalQuantity = inventory.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('totalQuantity').textContent = totalQuantity;
    
    const lowStockItems = inventory.filter(item => item.quantity <= item.minQuantity && item.quantity > 0).length;
    document.getElementById('lowStock').textContent = lowStockItems;
    
    const outOfStockItems = inventory.filter(item => item.quantity === 0).length;
    document.getElementById('outOfStock').textContent = outOfStockItems;
}

// Delete item
function deleteItem(itemId) {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    const itemIndex = inventory.findIndex(item => item.id === itemId);
    if (itemIndex !== -1) {
        const itemName = inventory[itemIndex].name;
        inventory.splice(itemIndex, 1);
        
        saveData();
        renderInventory();
        populateReduceItemSelect();
        updateStatistics();
        
        showNotification(`${itemName} deleted successfully!`, 'success');
    }
}

// ── Debounce utility ─────────────────────────────────────────────────────────
function debounce(fn, delay) {
    let t; return function(...a) { clearTimeout(t); t = setTimeout(() => fn.apply(this,a), delay); };
}

// ── Inventory search filter ───────────────────────────────────────────────
function _filterInventoryNow(term) {
    const q = term.trim().toLowerCase();
    invCurrentPage  = 1;
    invFilteredList = q === '' ? null : inventory.filter(item =>
        item.name.toLowerCase().includes(q) ||
        (item.category      && item.category.toLowerCase().includes(q)) ||
        (item.description   && item.description.toLowerCase().includes(q)) ||
        (item.location      && item.location.toLowerCase().includes(q)) ||
        (item.sourceOfFunds && item.sourceOfFunds.toLowerCase().includes(q)) ||
        (item.poNumber      && item.poNumber.toLowerCase().includes(q))
    );
    renderInventory();
}
const filterInventory = debounce(_filterInventoryNow, 250);

// ── Edit Item Modal ───────────────────────────────────────────────────────
let editingItemId = null;

function openEditModal(itemId) {
    const item = inventory.find(i => i.id === itemId);
    if (!item) return;
    editingItemId = itemId;

    document.getElementById('editItemName').value      = item.name || '';
    document.getElementById('editCategory').value      = item.category || '';
    document.getElementById('editDescription').value   = item.description || '';
    document.getElementById('editQuantity').value      = item.quantity ?? '';
    document.getElementById('editUnit').value          = item.unit || '';
    document.getElementById('editMinQuantity').value   = item.minQuantity ?? '';
    document.getElementById('editLocation').value      = item.location || '';
    document.getElementById('editSourceOfFunds').value = item.sourceOfFunds || '';
    document.getElementById('editPoNumber').value      = item.poNumber || '';
    document.getElementById('editDateDelivered').value = item.dateDelivered || '';
    document.getElementById('editExpiryDate').value    = item.expiryDate || '';

    document.getElementById('editModal').classList.add('open');
}

function saveEditItem() {
    if (!editingItemId) return;
    const idx = inventory.findIndex(i => i.id === editingItemId);
    if (idx === -1) return;

    const name = document.getElementById('editItemName').value.trim();
    const qty  = parseInt(document.getElementById('editQuantity').value);
    const min  = parseInt(document.getElementById('editMinQuantity').value);

    if (!name)       { showNotification('Item name is required!', 'error'); return; }
    if (isNaN(qty))  { showNotification('Quantity is required!', 'error'); return; }
    if (isNaN(min))  { showNotification('Reorder point is required!', 'error'); return; }

    inventory[idx] = {
        ...inventory[idx],
        name,
        category:      document.getElementById('editCategory').value,
        description:   document.getElementById('editDescription').value.trim(),
        quantity:      qty,
        unit:          document.getElementById('editUnit').value,
        minQuantity:   min,
        location:      document.getElementById('editLocation').value.trim(),
        sourceOfFunds: document.getElementById('editSourceOfFunds').value.trim(),
        poNumber:      document.getElementById('editPoNumber').value.trim(),
        dateDelivered: document.getElementById('editDateDelivered').value,
        expiryDate:    document.getElementById('editExpiryDate').value,
    };

    saveData();
    renderInventory();
    populateReduceItemSelect();
    updateStatistics();
    closeEditModal();
    showNotification(`"${name}" updated successfully!`, 'success');
}

function closeEditModal(event) {
    if (event && event.target !== document.getElementById('editModal')) return;
    document.getElementById('editModal').classList.remove('open');
    editingItemId = null;
}
// ─────────────────────────────────────────────────────────────────────────

// Quick add quantity function
function addQuantity(itemId) {
    const item = inventory.find(item => item.id === itemId);
    if (!item) return;
    
    const quantity = prompt(`Enter quantity to add to ${item.name}:`);
    if (quantity && !isNaN(quantity) && parseInt(quantity) > 0) {
        const itemIndex = inventory.findIndex(item => item.id === itemId);
        inventory[itemIndex].quantity += parseInt(quantity);
        
        const transaction = {
            id: Date.now(),
            itemId: itemId,
            itemName: inventory[itemIndex].name,
            type: 'add',
            quantity: parseInt(quantity),
            recipient: 'Supply Office',
            purpose: 'Quick Restock',
            notes: 'Quick add from inventory table',
            timestamp: new Date().toISOString()
        };
        
        transactions.unshift(transaction);
        
        saveData();
        renderInventory();
        renderTransactions();
        populateReduceItemSelect();
        updateStatistics();
        
        showNotification(`Added ${quantity} to ${inventory[itemIndex].name}`, 'success');
    }
}

// Quick reduce quantity function
function reduceQuantity(itemId) {
    const item = inventory.find(item => item.id === itemId);
    if (!item) return;
    
    const quantity = prompt(`Enter quantity to reduce (max: ${item.quantity}):`);
    if (quantity && !isNaN(quantity) && parseInt(quantity) > 0) {
        if (parseInt(quantity) > item.quantity) {
            showNotification(`Cannot reduce more than available quantity (${item.quantity})`, 'error');
            return;
        }
        
        const recipient = prompt('Enter recipient/department:');
        if (!recipient) return;
        
        const purpose = prompt('Enter purpose/reason:');
        if (!purpose) return;
        
        const itemIndex = inventory.findIndex(item => item.id === itemId);
        inventory[itemIndex].quantity -= parseInt(quantity);
        
        const transaction = {
            id: Date.now(),
            itemId: itemId,
            itemName: item.name,
            type: 'reduce',
            quantity: parseInt(quantity),
            recipient: recipient,
            purpose: purpose,
            notes: 'Quick reduction from inventory table',
            timestamp: new Date().toISOString()
        };
        
        transactions.unshift(transaction);
        
        saveData();
        renderInventory();
        renderTransactions();
        populateReduceItemSelect();
        updateStatistics();
        
        showNotification(`Reduced ${quantity} from ${item.name}`, 'success');
    }
}

// View item details — opens a clean modal instead of a browser alert
let _detailsItemId = null;

function viewItemDetails(itemId) {
    const item = inventory.find(i => i.id === itemId);
    if (!item) return;
    _detailsItemId = itemId;

    const stockStatus = getStockStatus(item);

    // Stock badge
    let badgeClass = 'badge-good', badgeLabel = 'Good';
    if (item.quantity === 0)                    { badgeClass = 'badge-critical'; badgeLabel = 'Out of Stock'; }
    else if (item.quantity <= item.minQuantity) { badgeClass = 'badge-low';      badgeLabel = 'Low Stock'; }

    // Expiry info
    let expiryInfo = 'N/A';
    let expiryColor = '';
    if (item.expiryDate) {
        const days = Math.floor((new Date(item.expiryDate) - new Date()) / 86400000);
        expiryInfo = new Date(item.expiryDate).toLocaleDateString();
        if (days < 0)       { expiryInfo += ' — EXPIRED';               expiryColor = '#e74c3c'; }
        else if (days <= 30){ expiryInfo += ` — expires in ${days} day${days===1?'':'s'}`; expiryColor = '#d97706'; }
    }

    // Header accent color
    const headerColor = item.quantity === 0 ? '#fee2e2' :
                        item.quantity <= item.minQuantity ? '#fffbeb' : '#f0fdf4';

    document.getElementById('itemDetailsHeader').style.background = headerColor;
    document.getElementById('itemDetailsName').textContent = item.name;
    document.getElementById('itemDetailsBadge').innerHTML =
        `<span class="stock-badge ${badgeClass}"><span class="dot"></span>${badgeLabel}</span>` +
        `<span style="font-size:12px; color:#64748b; margin-left:8px;">${item.category}</span>`;

    const row = (label, value, color) =>
        `<div class="detail-row">
            <span class="detail-label">${label}</span>
            <span class="detail-value"${color ? ` style="color:${color};font-weight:600;"` : ''}>${value || '<span style="color:#cbd5e1;">—</span>'}</span>
        </div>`;

    document.getElementById('itemDetailsContent').innerHTML = `
        <div style="padding:16px 20px;">
            <div class="detail-section-title">Stock</div>
            ${row('Current Quantity', `${item.quantity} ${item.unit}`)}
            ${row('Reorder Point', `${item.minQuantity} ${item.unit}`)}
            ${row('Location', item.location)}
            <div class="detail-section-title" style="margin-top:14px;">Item Info</div>
            ${row('Description', item.description)}
            ${row('Source of Funds', item.sourceOfFunds)}
            ${row('P.O. No.', item.poNumber)}
            ${row('Date Delivered', item.dateDelivered ? new Date(item.dateDelivered).toLocaleDateString() : null)}
            ${row('Expiry Date', item.expiryDate ? expiryInfo : null, expiryColor)}
            ${row('Date Added', new Date(item.createdAt).toLocaleDateString())}
        </div>`;

    document.getElementById('itemDetailsModal').classList.add('open');
}

function closeItemDetailsModal(event) {
    const modal = document.getElementById('itemDetailsModal');
    if (!event || event.target === modal) {
        modal.classList.remove('open');
        _detailsItemId = null;
    }
}

// "Edit Item" button inside the details modal — closes details, opens edit
function detailsToEdit() {
    const id = _detailsItemId;
    closeItemDetailsModal();
    if (id) openEditModal(id);
}

// Export to JSON
function exportToJSON() {
    const data = {
        inventory: inventory,
        transactions: transactions,
        exportedAt: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `medical-inventory-${new Date().toISOString().slice(0,10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showNotification('Data exported to JSON successfully!', 'success');
}

// Export to Excel (CSV format)
function exportToExcel() {
    // Create CSV for inventory
    let csvContent = "Supply Office Inventory Report\n";
    csvContent += `Generated: ${new Date().toLocaleString()}\n\n`;
    
    csvContent += "INVENTORY\n";
    csvContent += "Item Name,Description,Source of Funds,P.O. No.,Date Delivered,Category,Current Quantity,Unit,Min Quantity,Expiry Date,Status,Location,Date Added\n";
    
    inventory.forEach(item => {
        const status = getStockStatus(item);
        const expiryDate = item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A';
        const deliveredDate = item.dateDelivered ? new Date(item.dateDelivered).toLocaleDateString() : 'N/A';
        csvContent += `"${item.name}","${item.description || ''}","${item.sourceOfFunds || ''}","${item.poNumber || ''}","${deliveredDate}","${item.category}",${item.quantity},"${item.unit}",${item.minQuantity},"${expiryDate}","${status}","${item.location}","${new Date(item.createdAt).toLocaleDateString()}"\n`;
    });
    
    csvContent += "\n\nTRANSACTIONS\n";
    csvContent += "Date & Time,Item Name,Type,Quantity,Recipient,Purpose,Notes\n";
    
    transactions.forEach(transaction => {
        const type = transaction.type === 'add' ? 'Added' : 'Reduced';
        csvContent += `"${new Date(transaction.timestamp).toLocaleString()}","${transaction.itemName}","${type}",${transaction.quantity},"${transaction.recipient}","${transaction.purpose}","${transaction.notes}"\n`;
    });
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `medical-inventory-${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Data exported to Excel (CSV) successfully!', 'success');
}

// Export to PDF
function exportToPDF() {
    // Create a printable version
    const printWindow = window.open('', '', 'height=800,width=1000');
    
    printWindow.document.write('<html><head><title>Supply Office Inventory Report</title>');
    printWindow.document.write('<style>');
    printWindow.document.write('body { font-family: Arial, sans-serif; margin: 20px; }');
    printWindow.document.write('h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }');
    printWindow.document.write('h2 { color: #2c3e50; margin-top: 30px; border-bottom: 2px solid #ecf0f1; padding-bottom: 5px; }');
    printWindow.document.write('table { width: 100%; border-collapse: collapse; margin-top: 15px; }');
    printWindow.document.write('th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }');
    printWindow.document.write('th { background-color: #f8fafc; font-weight: bold; }');
    printWindow.document.write('.low-stock { background-color: #fff8e1; }');
    printWindow.document.write('.critical-stock { background-color: #ffebee; }');
    printWindow.document.write('.add-transaction { background-color: #d4edda; }');
    printWindow.document.write('.reduce-transaction { background-color: #f8d7da; }');
    printWindow.document.write('.info { color: #64748b; margin-top: 5px; }');
    printWindow.document.write('@media print { .no-print { display: none; } }');
    printWindow.document.write('</style>');
    printWindow.document.write('</head><body>');
    
    printWindow.document.write('<h1>Supply Office Inventory Report</h1>');
    printWindow.document.write(`<p class="info">Generated: ${new Date().toLocaleString()}</p>`);
    
    // Summary statistics
    printWindow.document.write('<h2>Summary Statistics</h2>');
    printWindow.document.write('<table>');
    printWindow.document.write('<tr><th>Total Items</th><th>Total Quantity</th><th>Low Stock Items</th><th>Out of Stock</th></tr>');
    printWindow.document.write(`<tr><td>${inventory.length}</td><td>${inventory.reduce((sum, item) => sum + item.quantity, 0)}</td><td>${inventory.filter(item => item.quantity <= item.minQuantity && item.quantity > 0).length}</td><td>${inventory.filter(item => item.quantity === 0).length}</td></tr>`);
    printWindow.document.write('</table>');
    
    // Inventory table
    printWindow.document.write('<h2>Current Inventory</h2>');
    printWindow.document.write('<table>');
    printWindow.document.write('<tr><th>Item Name</th><th>Description</th><th>Source of Funds</th><th>P.O. No.</th><th>Date Delivered</th><th>Category</th><th>Quantity</th><th>Min Qty</th><th>Expiry Date</th><th>Status</th><th>Location</th></tr>');
    
    inventory.forEach(item => {
        const status = getStockStatus(item);
        const rowClass = item.quantity === 0 ? 'critical-stock' : item.quantity <= item.minQuantity ? 'low-stock' : '';
        const expiryDate = item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A';
        const deliveredDate = item.dateDelivered ? new Date(item.dateDelivered).toLocaleDateString() : 'N/A';
        printWindow.document.write(`<tr class="${rowClass}"><td>${item.name}</td><td>${item.description || '-'}</td><td>${item.sourceOfFunds || '-'}</td><td>${item.poNumber || '-'}</td><td>${deliveredDate}</td><td>${item.category}</td><td>${item.quantity} ${item.unit}</td><td>${item.minQuantity} ${item.unit}</td><td>${expiryDate}</td><td>${status}</td><td>${item.location}</td></tr>`);
    });
    
    printWindow.document.write('</table>');
    
    // Recent transactions
    printWindow.document.write('<h2>Recent Transactions</h2>');
    printWindow.document.write('<table>');
    printWindow.document.write('<tr><th>Date & Time</th><th>Item Name</th><th>Type</th><th>Quantity</th><th>Recipient</th><th>Purpose</th></tr>');
    
    transactions.slice(0, 20).forEach(transaction => {
        const rowClass = transaction.type === 'add' ? 'add-transaction' : 'reduce-transaction';
        const typeSymbol = transaction.type === 'add' ? '+' : '-';
        printWindow.document.write(`<tr class="${rowClass}"><td>${new Date(transaction.timestamp).toLocaleString()}</td><td>${transaction.itemName}</td><td>${transaction.type.toUpperCase()}</td><td>${typeSymbol}${transaction.quantity}</td><td>${transaction.recipient}</td><td>${transaction.purpose}</td></tr>`);
    });
    
    printWindow.document.write('</table>');
    
    printWindow.document.write('<div class="no-print" style="margin-top: 30px; text-align: center;">');
    printWindow.document.write('<button onclick="window.print()" style="padding: 10px 20px; background-color: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px;">Print / Save as PDF</button>');
    printWindow.document.write('</div>');
    
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    
    showNotification('PDF preview opened in new window. Use Print to save as PDF.', 'info');
}

// Backup all data
function backupAllData() {
    const backup = {
        inventory: inventory,
        transactions: transactions,
        backupDate: new Date().toISOString(),
        version: '1.0'
    };
    
    const dataStr = JSON.stringify(backup, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `supply-inventory-backup-${new Date().toISOString().slice(0,10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showNotification('Complete backup created successfully!', 'success');
}

// Import backup data
function importBackup() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = e => {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = function(event) {
            try {
                const backup = JSON.parse(event.target.result);
                
                if (confirm('This will replace all current data. Are you sure you want to continue?')) {
                    inventory = backup.inventory || [];
                    transactions = backup.transactions || [];
                    
                    saveData();
                    renderInventory();
                    renderTransactions();
                    populateReduceItemSelect();
                    updateStatistics();
                    
                    showNotification('Backup imported successfully!', 'success');
                }
            } catch (error) {
                showNotification('Error importing backup file', 'error');
                console.error('Import error:', error);
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

// Clear add form
function clearAddForm() {
    document.getElementById('addItemForm').reset();
}

// Clear reduce form
function clearReduceForm() {
    document.getElementById('reduceItemForm').reset();
    document.getElementById('reduceItemSearch').value = '';
    document.getElementById('reduceItemId').value = '';
    document.getElementById('searchResults').classList.remove('show');
    document.getElementById('recipientSearch').value = '';
    document.getElementById('recipient').value = '';
    document.getElementById('receivedBy').value = '';
    document.getElementById('transactionDate').value = '';
    document.getElementById('recipientResults').classList.remove('show');
}

// Show notification
function showNotification(message, type) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Delete individual transaction
function deleteTransaction(transactionId) {
    if (!confirm('Are you sure you want to delete this transaction record?')) return;
    
    const transactionIndex = transactions.findIndex(t => t.id === transactionId);
    if (transactionIndex !== -1) {
        transactions.splice(transactionIndex, 1);
        saveData();
        renderTransactions();
        showNotification('Transaction deleted successfully!', 'success');
    }
}

// Print receipt for an existing transaction
function printTransactionReceipt(transactionId) {
    const transaction = transactions.find(t => t.id === transactionId);
    if (!transaction) {
        showNotification('Transaction not found!', 'error');
        return;
    }
    
    const item = inventory.find(i => i.id === transaction.itemId);
    
    generateAcknowledgementReceipt({
        recipient: transaction.recipient,
        purpose: transaction.purpose,
        notes: transaction.notes,
        timestamp: transaction.timestamp,
        items: [{
            itemName: transaction.itemName,
            category: item ? item.category : 'N/A',
            quantity: transaction.quantity,
            unit: item ? item.unit : 'unit(s)',
            description: item ? item.description : ''
        }]
    });
}

// Undo the most recent transaction
function undoLastTransaction() {
    if (transactions.length === 0) {
        showNotification('No transactions to undo.', 'info');
        return;
    }

    const latest = transactions[0];
    const itemIndex = inventory.findIndex(item => item.id === latest.itemId);

    if (itemIndex === -1) {
        // Item was deleted — can only remove the transaction record
        if (!confirm(`The item "${latest.itemName}" no longer exists in inventory. Remove the transaction record only?`)) return;
        transactions.shift();
        saveData();
        renderTransactions();
        updateStatistics();
        showNotification(`Transaction record for "${latest.itemName}" removed.`, 'success');
        return;
    }

    const typeLabel = latest.type === 'reduce' ? 'reduce' : 'add';
    const confirmMsg = `Undo last transaction?\n\n"${latest.type === 'reduce' ? '-' : '+'}${latest.quantity}" of "${latest.itemName}" (${latest.type})\nRecipient: ${latest.recipient || 'N/A'}\nTime: ${new Date(latest.timestamp).toLocaleString()}`;

    if (!confirm(confirmMsg)) return;

    // Reverse the quantity change
    if (latest.type === 'reduce') {
        inventory[itemIndex].quantity += latest.quantity;
    } else if (latest.type === 'add') {
        inventory[itemIndex].quantity -= latest.quantity;
        if (inventory[itemIndex].quantity < 0) inventory[itemIndex].quantity = 0;
    }

    transactions.shift();

    saveData();
    renderInventory();
    renderTransactions();
    populateReduceItemSelect();
    updateStatistics();
    showNotification(`Last transaction undone: "${latest.itemName}" restored.`, 'success');
}

// Clear all transactions
function clearTransactions() {
    if (transactions.length === 0) {
        showNotification('No transactions to clear.', 'info');
        return;
    }
    if (!confirm('Are you sure you want to clear all transaction history? This cannot be undone.')) return;
    transactions = [];
    saveData();
    renderTransactions();
    showNotification('Transaction history cleared.', 'success');
}

// Show stock modal (type: 'low' or 'out')
function showStockModal(type) {
    const modal = document.getElementById('stockModal');
    const title = document.getElementById('modalTitle');
    const body = document.getElementById('modalBody');

    let items, titleText, itemClass, qtyColor;

    if (type === 'low') {
        items = inventory.filter(item => item.quantity <= item.minQuantity && item.quantity > 0);
        titleText = `⚠️ Low Stock Items (${items.length})`;
        itemClass = 'modal-item-low';
        qtyColor = '#f39c12';
    } else {
        items = inventory.filter(item => item.quantity === 0);
        titleText = `🚨 Out of Stock Items (${items.length})`;
        itemClass = 'modal-item-out';
        qtyColor = '#e74c3c';
    }

    title.textContent = titleText;

    if (items.length === 0) {
        body.innerHTML = `<div class="modal-empty">${type === 'low' ? 'No low stock items! Everything is well stocked.' : 'No out of stock items! Great job keeping inventory full.'}</div>`;
    } else {
        body.innerHTML = items.map(item => `
            <div class="modal-item ${itemClass}">
                <div>
                    <div class="modal-item-name">${item.name}</div>
                    <div class="modal-item-details">${item.category}${item.location ? ' · ' + item.location : ''}</div>
                </div>
                <div class="modal-item-qty" style="color: ${qtyColor};">
                    ${item.quantity} / ${item.minQuantity} ${item.unit}<br>
                    <span style="font-weight: 400; font-size: 11px; color: #94a3b8;">qty / min</span>
                </div>
            </div>
        `).join('');
    }

    modal.classList.add('open');
}

// Generate Acknowledgement Receipt (half-page: 5.5in x 8.5in)
function generateAcknowledgementReceipt(data) {
    // data.items is an array: [{ itemName, category, quantity, unit, description }]
    // For backward compat, if no items array, build one from flat fields
    const items = data.items || [{
        itemName: data.itemName,
        category: data.category,
        quantity: data.quantity,
        unit: data.unit,
        description: data.description || ''
    }];

    const receiptWindow = window.open('', '', 'width=620,height=900');

    // Build receipt number
    const now = new Date();
    const dd  = String(now.getDate()).padStart(2, '0');
    const mm  = String(now.getMonth() + 1).padStart(2, '0');
    const yy  = String(now.getFullYear()).slice(-2);
    const hh  = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const txn = String(transactions.length).padStart(4, '0');
    const receiptNumber = `${dd}-${mm}-${yy}-${hh}-${min}-${txn}`;

    // Build items rows
    const itemRows = items.map(it => `
      <tr>
        <td>${it.itemName}${it.description ? `<br><span style="font-size:7.5pt;color:#64748b;padding-left:10pt;display:inline-block;">↳ ${it.description}</span>` : ''}</td>
        <td>${it.category}</td>
        <td>${it.quantity} ${it.unit}</td>
      </tr>`).join('');

    const totalQty = items.reduce((sum, it) => sum + it.quantity, 0);
    const notesRow = data.notes
        ? `<tr><td class="lbl">Notes:</td><td>${data.notes}</td></tr>` : '';

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Acknowledgement Receipt</title>
  <style>
    /* ── Page setup: 8.5x11 with 1-inch margins ── */
    @page {
      size: 8.5in 11in;
      margin: 1in;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.5;
      color: #1a1a2e;
      width: 6.5in;
      margin: 0;
    }

    /* ── Header ── */
    .header {
      text-align: center;
      border-bottom: 1.5pt solid #2c3e50;
      margin-bottom: 10pt;
    }
    .header h1 {
      font-size: 15pt;
      font-weight: 900;
      letter-spacing: 0.5pt;
      color: #2c3e50;
      text-transform: uppercase;
    }
    .header h2 {
      font-size: 11pt;
      font-weight: normal;
      color: #3498db;
      margin-top: 2pt;
    }

    /* ── Receipt number ── */
    .rcpt-no {
      text-align: right;
      font-size: 8.5pt;
      color: #64748b;
      margin-bottom: 8pt;
    }

    /* ── Info table ── */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8pt;
    }
    td { padding: 2pt 0; vertical-align: top; }
    td.lbl {
      font-weight: bold;
      color: #2c3e50;
      white-space: nowrap;
      width: 110pt;
    }

    /* ── Items table ── */
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin: 8pt 0;
      font-size: 9pt;
    }
    .items-table thead tr {
      background: #2c3e50;
      color: #fff;
    }
    .items-table thead th {
      padding: 4pt 6pt;
      text-align: left;
      font-weight: 700;
      font-size: 8.5pt;
    }
    .items-table thead th:last-child {
      text-align: right;
    }
    .items-table tbody tr:nth-child(even) { background: #f0f4f8; }
    .items-table tbody tr:nth-child(odd)  { background: #fff; }
    .items-table tbody td {
      padding: 4pt 6pt;
      vertical-align: middle;
      border-bottom: 0.5pt solid #e2e8f0;
    }
    .items-table tbody td:last-child {
      text-align: right;
      font-weight: 700;
      color: #e74c3c;
      white-space: nowrap;
    }
    .items-table tfoot tr {
      background: #f8fafc;
      border-top: 1.5pt solid #2c3e50;
    }
    .items-table tfoot td {
      padding: 4pt 6pt;
      font-weight: 700;
      font-size: 9.5pt;
      color: #2c3e50;
    }
    .items-table tfoot td:last-child {
      text-align: right;
      color: #e74c3c;
    }

    /* ── Divider ── */
    .divider {
      border: none;
      border-top: 0.75pt dashed #cbd5e1;
      margin: 8pt 0;
    }

    /* ── Signature ── */
    .sig-section { margin-top: 18pt; }
    .sig-note {
      font-size: 9pt;
      font-style: italic;
      color: #444;
      margin-bottom: 22pt;
    }
    .sig-line {
      border-bottom: 1pt solid #2c3e50;
      margin-bottom: 3pt;
    }
    .sig-label {
      font-size: 8pt;
      text-align: center;
      color: #2c3e50;
    }

    /* ── Footer ── */
    .footer {
      margin-top: 10pt;
      border-top: 0.75pt solid #e2e8f0;
      text-align: center;
      font-size: 7.5pt;
      color: #94a3b8;
    }

    /* ── Print/Save buttons (screen only) ── */
    .btn-row {
      display: flex;
      gap: 10pt;
      justify-content: center;
      margin-top: 16pt;
    }
    .print-btn, .save-img-btn {
      padding: 8pt 22pt;
      border: none;
      border-radius: 4pt;
      font-size: 11pt;
      cursor: pointer;
      color: #fff;
    }
    .print-btn { background: #3498db; }
    .print-btn:hover { background: #2980b9; }
    .save-img-btn { background: #27ae60; }
    .save-img-btn:hover { background: #219a52; }
    @media print { .btn-row { display: none; } }
  </style>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
</head>
<body>

  <div class="header">
    <h1>Supply Office</h1>
    <h2>Acknowledgement Receipt</h2>
  </div>

  <div class="rcpt-no">Receipt No: ${receiptNumber}</div>

  <!-- Date / Time -->
  <table>
    <tr>
      <td class="lbl">Date &amp; Time:</td>
      <td>${new Date(data.timestamp).toLocaleString()}</td>
    </tr>
  </table>

  <hr class="divider">

  <!-- 3-column items table -->
  <table class="items-table">
    <thead>
      <tr>
        <th style="width:45%;">Item Name</th>
        <th style="width:30%;">Category</th>
        <th style="width:25%;">Qty / Amount</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="2">Total Items: ${items.length}</td>
        <td>${totalQty} unit(s)</td>
      </tr>
    </tfoot>
  </table>

  <hr class="divider">

  <!-- Recipient info -->
  <table>
    <tr><td class="lbl">Released By:</td><td>___________________</td></tr>
    <tr><td class="lbl">Received By:</td><td><u>${data.recipient}${data.receivedBy ? ` &nbsp;·&nbsp; <em>${data.receivedBy}</em>` : ''}</td></u></tr>
    <tr><td class="lbl">Purpose:</td><td><u>${data.purpose}</td></u></tr>
    ${notesRow}
  </table>

  <!-- Signature -->
  <div class="sig-section">
    <p class="sig-note">I acknowledge receipt of the above item(s) in good condition.</p>
    <div class="sig-line"></div>
    <div class="sig-label">Signature Over Printed Name &amp; Date</div>
  </div>

  <!-- Footer -->
  <div class="footer">
    Computer-generated receipt &bull; Supply Office Inventory System<br>
    Generated: ${new Date().toLocaleString()}
  </div>

  <div class="btn-row">
    <button class="print-btn" onclick="window.print()">🖨 Print Receipt</button>
    <button class="save-img-btn" id="saveImgBtn" onclick="saveAsImage()">🖼 Save as Image</button>
  </div>

  <script>
    function saveAsImage() {
      const btn = document.getElementById('saveImgBtn');
      btn.disabled = true;
      btn.textContent = 'Saving...';
      const btnRow = document.querySelector('.btn-row');
      btnRow.style.display = 'none';

      html2canvas(document.body, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      }).then(function(canvas) {
        btnRow.style.display = 'flex';
        btn.disabled = false;
        btn.textContent = '🖼 Save as Image';

        const link = document.createElement('a');
        link.download = 'receipt-${receiptNumber}.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
      }).catch(function() {
        btnRow.style.display = 'flex';
        btn.disabled = false;
        btn.textContent = '🖼 Save as Image';
        alert('Could not save image. Try printing instead.');
      });
    }
  </script>
</body>
</html>`;

    receiptWindow.document.write(html);
    receiptWindow.document.close();
}

// Close stock modal
function closeStockModal(event) {
    const modal = document.getElementById('stockModal');
    // Close only if clicking overlay background or the X button
    if (!event || event.target === modal || event.currentTarget === document.querySelector('.modal-close')) {
        modal.classList.remove('open');
    }
}
