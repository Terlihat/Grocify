document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const dashboardView = document.getElementById('dashboard-view');
    const detailView = document.getElementById('detail-view');
    const listsContainer = document.getElementById('lists-container');
    const newListInput = document.getElementById('new-list-input');
    const createListBtn = document.getElementById('create-list-btn');
    const backBtn = document.getElementById('back-btn');
    const currentListTitle = document.getElementById('current-list-title');

    const itemInput = document.getElementById('item-input');
    const priceInput = document.getElementById('price-input');
    const categorySelect = document.getElementById('category-select');
    const addBtn = document.getElementById('add-btn');
    const shoppingList = document.getElementById('shopping-list');
    const totalPriceEl = document.getElementById('total-price');
    const completedPriceEl = document.getElementById('completed-price');
    const suggestionsContainer = document.getElementById('suggestions-container');
    const mainScroll = document.getElementById('main-scroll');
    const micBtn = document.getElementById('mic-btn');

    const categories = ["Umum", "Sayuran & Buah", "Daging & Ikan", "Bumbu Dapur", "Minuman", "Kebersihan"];

    // --- State Management ---
    let appData = JSON.parse(localStorage.getItem('grocify_app_data')) || [];
    let itemHistory = JSON.parse(localStorage.getItem('grocify_history')) || [];
    let currentListId = null;

    // --- Migrasi Data Lama ---
    const oldData = localStorage.getItem('grocify_data');
    if (oldData && appData.length === 0) {
        appData.push({
            id: Date.now().toString(),
            name: "Daftar Sebelumnya",
            items: JSON.parse(oldData).map(item => ({
                ...item,
                qty: item.qty || 1,
                unit: item.unit || 'Pcs'
            }))
        });
        localStorage.setItem('grocify_app_data', JSON.stringify(appData));
        localStorage.removeItem('grocify_data');
    }

    const saveAppData = () => {
        localStorage.setItem('grocify_app_data', JSON.stringify(appData));
    };

    const saveToHistory = (text) => {
        const cleanText = text.trim();
        const isExist = itemHistory.some(h => h.toLowerCase() === cleanText.toLowerCase());
        if (!isExist && cleanText !== '') {
            itemHistory.push(cleanText);
            localStorage.setItem('grocify_history', JSON.stringify(itemHistory));
        }
    };

    const formatRupiah = (num) => {
        return 'Rp ' + new Intl.NumberFormat('id-ID').format(num);
    };

    // Format Tanggal: DD-MM-YY (31-06-26)
    const formatDate = (timestamp) => {
        const d = new Date(parseInt(timestamp));
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = String(d.getFullYear()).slice(-2);
        return `${day}-${month}-${year}`;
    };

    // --- DASHBOARD LOGIC ---
    const renderDashboard = () => {
        listsContainer.innerHTML = '';
        
        if(appData.length === 0) {
            listsContainer.innerHTML = `<p style="text-align:center; color: var(--text-secondary); margin-top: 20px; font-size: 14px;">Belum ada daftar belanja. Buat satu di atas!</p>`;
        }

        appData.forEach(list => {
            let totalItems = list.items.length;
            let completedItems = list.items.filter(i => i.completed).length;
            let totalBudget = list.items.reduce((acc, curr) => acc + ((parseInt(curr.price) || 0) * (parseInt(curr.qty) || 1)), 0);

            const card = document.createElement('div');
            card.className = 'list-card';
            card.innerHTML = `
                <div class="list-card-header">
                    <div class="list-card-title-area">
                        <span class="list-card-title">${list.name}</span>
                        <span class="list-card-date"><i class="fa-regular fa-calendar-days"></i> ${formatDate(list.id)}</span>
                    </div>
                </div>
                <div class="list-card-stats">
                    <div class="stat-item"><i class="fa-solid fa-box"></i> ${completedItems}/${totalItems} Selesai</div>
                    <div class="stat-item"><i class="fa-solid fa-wallet"></i> ${formatRupiah(totalBudget)}</div>
                </div>
                <div class="list-card-actions">
                    <button class="btn-open" onclick="openList('${list.id}')">Buka Daftar</button>
                    <button class="btn-share-list" onclick="shareList('${list.id}')" aria-label="Bagikan"><i class="fa-brands fa-whatsapp"></i></button>
                    <button class="btn-delete-list" onclick="deleteList('${list.id}')" aria-label="Hapus"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            `;
            listsContainer.appendChild(card);
        });
    };

    createListBtn.addEventListener('click', () => {
        const name = newListInput.value.trim();
        if(name !== '') {
            appData.unshift({ id: Date.now().toString(), name: name, items: [] });
            saveAppData();
            newListInput.value = '';
            renderDashboard();
        }
    });

    window.deleteList = (id) => {
        if(confirm("Yakin ingin menghapus daftar ini secara permanen?")) {
            appData = appData.filter(list => list.id !== id);
            saveAppData();
            renderDashboard();
        }
    };

    window.openList = (id) => {
        currentListId = id;
        const currentList = appData.find(l => l.id === id);
        currentListTitle.textContent = currentList.name;
        
        dashboardView.style.display = 'none';
        detailView.style.display = 'flex';
        renderDetailList();
    };

    backBtn.addEventListener('click', () => {
        currentListId = null;
        detailView.style.display = 'none';
        dashboardView.style.display = 'flex';
        renderDashboard();
    });

    // --- SHARE LOGIC (Global via WA) ---
    window.shareList = (id) => {
        const listToShare = appData.find(l => l.id === id);
        if (!listToShare || listToShare.items.length === 0) { 
            alert('Daftar belanja masih kosong!'); 
            return; 
        }

        let waText = `*Daftar: ${listToShare.name}* 🛒\n_Dibuat: ${formatDate(listToShare.id)}_\n\n`;
        let totalAnggaran = 0;
        let totalDibeli = 0;
        
        const itemsWithIndex = listToShare.items.map(item => {
            const itemPrice = parseInt(item.price) || 0;
            const itemQty = parseInt(item.qty) || 1;
            const subTotal = itemPrice * itemQty;
            
            totalAnggaran += subTotal;
            if (item.completed) totalDibeli += subTotal;
            
            return { ...item, price: itemPrice, qty: itemQty, category: item.category || 'Umum' };
        });
        
        categories.forEach(category => {
            const catItems = itemsWithIndex.filter(item => item.category === category);
            if (catItems.length > 0) {
                waText += `*_${category}_*\n`;
                catItems.forEach((item) => {
                    const statusIcon = item.completed ? '✅' : '⏳';
                    const priceText = item.price > 0 ? ` - ${formatRupiah(item.price * item.qty)}` : '';
                    waText += `- ${item.text} (${item.qty} ${item.unit.toLowerCase()})${priceText} ${statusIcon}\n`;
                });
                waText += `\n`;
            }
        });

        waText += `-----------------------\n*Total Estimasi:* ${formatRupiah(totalAnggaran)}\n*Sudah Dibeli:* ${formatRupiah(totalDibeli)}\n`;
        const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(waText)}`;
        window.open(waUrl, '_blank');
    };

    // --- DETAIL LIST LOGIC ---
    const renderDetailList = () => {
        const currentList = appData.find(l => l.id === currentListId);
        if(!currentList) return;

        shoppingList.innerHTML = ''; 
        let totalAnggaran = 0;
        let totalDibeli = 0;

        const itemsWithIndex = currentList.items.map((item, index) => {
            const itemPrice = parseInt(item.price) || 0;
            const itemQty = parseInt(item.qty) || 1;
            const subTotal = itemPrice * itemQty;
            
            totalAnggaran += subTotal;
            if (item.completed) totalDibeli += subTotal;

            return { 
                ...item, 
                price: itemPrice, 
                qty: itemQty,
                category: item.category || 'Umum', 
                originalIndex: index 
            };
        });

        totalPriceEl.textContent = formatRupiah(totalAnggaran);
        completedPriceEl.textContent = formatRupiah(totalDibeli);

        categories.forEach(category => {
            const catItems = itemsWithIndex.filter(item => item.category === category);
            if (catItems.length > 0) {
                const header = document.createElement('h3');
                header.className = 'category-header';
                let icon = '📦';
                if(category === 'Sayuran & Buah') icon = '🥬';
                if(category === 'Daging & Ikan') icon = '🥩';
                if(category === 'Bumbu Dapur') icon = '🧂';
                if(category === 'Minuman') icon = '🥤';
                if(category === 'Kebersihan') icon = '🧼';

                header.innerHTML = `${icon} ${category}`;
                shoppingList.appendChild(header);

                catItems.forEach(item => {
                    const li = document.createElement('li');
                    li.className = `list-item ${item.completed ? 'completed' : ''}`;
                    
                    const displayPrice = item.price > 0 ? formatRupiah(item.price * item.qty) : '';

                    li.innerHTML = `
                        <div class="item-left" onclick="toggleComplete(${item.originalIndex})">
                            <div class="checkbox"><i class="fa-solid fa-check"></i></div>
                            <div class="item-info">
                                <span class="item-text">${item.text}</span>
                                ${displayPrice ? `<span class="item-price">${displayPrice}</span>` : ''}
                            </div>
                        </div>
                        <div class="item-right-controls">
                            <div class="qty-container">
                                <button class="qty-btn" onclick="changeQty(${item.originalIndex}, -1)">-</button>
                                <span class="qty-val">${item.qty}</span>
                                <button class="qty-btn" onclick="changeQty(${item.originalIndex}, 1)">+</button>
                            </div>
                            <select class="unit-select" onchange="changeUnit(${item.originalIndex}, this.value)">
                                <option value="Pcs" ${item.unit === 'Pcs' ? 'selected' : ''}>pcs</option>
                                <option value="Kg" ${item.unit === 'Kg' ? 'selected' : ''}>kg</option>
                                <option value="Gr" ${item.unit === 'Gr' ? 'selected' : ''}>g</option>
                                <option value="Bks" ${item.unit === 'Bks' ? 'selected' : ''}>bks</option>
                                <option value="Ltr" ${item.unit === 'Ltr' ? 'selected' : ''}>ltr</option>
                                <option value="Ktk" ${item.unit === 'Ktk' ? 'selected' : ''}>ktk</option>
                                <option value="Unit" ${item.unit === 'Unit' ? 'selected' : ''}>unit</option>
                                <option value="Set" ${item.unit === 'Set' ? 'selected' : ''}>set</option>
                                <option value="Dus" ${item.unit === 'Dus' ? 'selected' : ''}>dus</option>
                                <option value="Pak" ${item.unit === 'Pak' ? 'selected' : ''}>pak</option>
                                <option value="Gros" ${item.unit === 'Gros' ? 'selected' : ''}>gros</option>
                                <option value="Rim" ${item.unit === 'Rim' ? 'selected' : ''}>rim</option>
                                <option value="Ons" ${item.unit === 'Ons' ? 'selected' : ''}>ons</option>
                            </select>
                            <button class="delete-btn" onclick="deleteItem(${item.originalIndex})"><i class="fa-solid fa-trash-can"></i></button>
                        </div>
                    `;
                    shoppingList.appendChild(li);
                });
            }
        });
    };

    window.changeQty = (index, change) => {
        const currentList = appData.find(l => l.id === currentListId);
        if(!currentList) return;
        
        let currentQty = parseInt(currentList.items[index].qty) || 1;
        currentQty += change;
        if(currentQty < 1) currentQty = 1;
        
        currentList.items[index].qty = currentQty;
        saveAppData();
        renderDetailList();
    };

    window.changeUnit = (index, value) => {
        const currentList = appData.find(l => l.id === currentListId);
        if(!currentList) return;
        
        currentList.items[index].unit = value;
        saveAppData();
        renderDetailList();
    };

    const addItem = () => {
        if(!currentListId) return;
        const currentList = appData.find(l => l.id === currentListId);

        const text = itemInput.value.trim();
        const price = parseInt(priceInput.value) || 0; 
        const category = categorySelect.value;
        
        if (text !== '') {
            currentList.items.push({ 
                text: text, 
                completed: false, 
                category: category, 
                price: price,
                qty: 1,
                unit: 'Pcs'
            });
            saveAppData();
            saveToHistory(text); 
            renderDetailList();
            
            itemInput.value = ''; 
            priceInput.value = ''; 
            suggestionsContainer.innerHTML = ''; 
            itemInput.focus(); 

            setTimeout(() => { if(mainScroll) mainScroll.scrollTop = mainScroll.scrollHeight; }, 50);
        }
    };

    window.toggleComplete = (index) => {
        const currentList = appData.find(l => l.id === currentListId);
        currentList.items[index].completed = !currentList.items[index].completed;
        saveAppData();
        renderDetailList();
    };

    window.deleteItem = (index) => {
        const currentList = appData.find(l => l.id === currentListId);
        currentList.items.splice(index, 1);
        saveAppData();
        renderDetailList();
    };

    itemInput.addEventListener('input', (e) => {
        const val = e.target.value.toLowerCase().trim();
        suggestionsContainer.innerHTML = ''; 
        if (val.length > 0) {
            const matches = itemHistory.filter(item => item.toLowerCase().includes(val) && item.toLowerCase() !== val).slice(0, 5); 
            matches.forEach(match => {
                const chip = document.createElement('div');
                chip.className = 'suggestion-chip';
                chip.textContent = match; 
                chip.addEventListener('click', () => { itemInput.value = match; suggestionsContainer.innerHTML = ''; priceInput.focus(); });
                suggestionsContainer.appendChild(chip);
            });
        }
    });

    addBtn.addEventListener('click', addItem);
    itemInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addItem(); });
    priceInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addItem(); });
    newListInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') createListBtn.click(); });

    // --- FITUR WEB SPEECH API ---
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition && micBtn) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'id-ID'; recognition.interimResults = false; recognition.maxAlternatives = 1;
        recognition.onstart = () => { micBtn.classList.add('recording'); itemInput.placeholder = "Mendengarkan..."; };
        recognition.onresult = (event) => {
            let cleanText = event.results[0][0].transcript.replace(/\.$/, '');
            itemInput.value = cleanText; itemInput.placeholder = "Nama barang..."; micBtn.classList.remove('recording'); priceInput.focus();
        };
        recognition.onerror = (event) => { micBtn.classList.remove('recording'); itemInput.placeholder = "Nama barang..."; };
        recognition.onend = () => { micBtn.classList.remove('recording'); itemInput.placeholder = "Nama barang..."; };
        micBtn.addEventListener('click', () => recognition.start());
    } else if (micBtn) { micBtn.style.display = 'none'; }

    renderDashboard();
});

// --- PWA: REGISTRASI SERVICE WORKER ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch((error) => console.log('ServiceWorker gagal:', error));
    });
}
