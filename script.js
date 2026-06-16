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
    const clearCompletedBtn = document.getElementById('clear-completed-btn');
    const shareBtn = document.getElementById('share-btn');
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

    // --- Migrasi Data Lama (Jika ada) ---
    const oldData = localStorage.getItem('grocify_data');
    if (oldData && appData.length === 0) {
        appData.push({
            id: Date.now().toString(),
            name: "Daftar Sebelumnya",
            items: JSON.parse(oldData)
        });
        localStorage.setItem('grocify_app_data', JSON.stringify(appData));
        localStorage.removeItem('grocify_data'); // Bersihkan data lama
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

    // --- DASHBOARD LOGIC ---
    const renderDashboard = () => {
        listsContainer.innerHTML = '';
        
        if(appData.length === 0) {
            listsContainer.innerHTML = `<p style="text-align:center; color: var(--text-secondary); margin-top: 20px;">Belum ada daftar belanja. Buat satu di atas!</p>`;
        }

        appData.forEach(list => {
            let totalItems = list.items.length;
            let completedItems = list.items.filter(i => i.completed).length;
            let totalBudget = list.items.reduce((acc, curr) => acc + (parseInt(curr.price) || 0), 0);

            const card = document.createElement('div');
            card.className = 'list-card';
            card.innerHTML = `
                <div class="list-card-header">
                    <span class="list-card-title">${list.name}</span>
                </div>
                <div class="list-card-stats">
                    <div class="stat-item"><i class="fa-solid fa-box"></i> ${completedItems}/${totalItems} Selesai</div>
                    <div class="stat-item"><i class="fa-solid fa-wallet"></i> ${formatRupiah(totalBudget)}</div>
                </div>
                <div class="list-card-actions">
                    <button class="btn-open" onclick="openList('${list.id}')">Buka Daftar</button>
                    <button class="btn-delete-list" onclick="deleteList('${list.id}')"><i class="fa-solid fa-trash-can"></i></button>
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

    // --- DETAIL LIST LOGIC ---
    const renderDetailList = () => {
        const currentList = appData.find(l => l.id === currentListId);
        if(!currentList) return;

        shoppingList.innerHTML = ''; 
        let totalAnggaran = 0;
        let totalDibeli = 0;

        const itemsWithIndex = currentList.items.map((item, index) => {
            const itemPrice = parseInt(item.price) || 0;
            totalAnggaran += itemPrice;
            if (item.completed) totalDibeli += itemPrice;
            return { ...item, price: itemPrice, category: item.category || 'Umum', originalIndex: index };
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
                    li.innerHTML = `
                        <div class="item-left" onclick="toggleComplete(${item.originalIndex})">
                            <div class="checkbox"><i class="fa-solid fa-check"></i></div>
                            <div class="item-info">
                                <span class="item-text">${item.text}</span>
                                ${item.price > 0 ? `<span class="item-price">${formatRupiah(item.price)}</span>` : ''}
                            </div>
                        </div>
                        <button class="delete-btn" onclick="deleteItem(${item.originalIndex})"><i class="fa-solid fa-trash-can"></i></button>
                    `;
                    shoppingList.appendChild(li);
                });
            }
        });
    };

    const addItem = () => {
        if(!currentListId) return;
        const currentList = appData.find(l => l.id === currentListId);

        const text = itemInput.value.trim();
        const price = parseInt(priceInput.value) || 0; 
        const category = categorySelect.value;
        
        if (text !== '') {
            currentList.items.push({ text: text, completed: false, category: category, price: price });
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

    clearCompletedBtn.addEventListener('click', () => {
        const currentList = appData.find(l => l.id === currentListId);
        currentList.items = currentList.items.filter(item => !item.completed);
        saveAppData();
        renderDetailList();
    });

    shareBtn.addEventListener('click', () => {
        const currentList = appData.find(l => l.id === currentListId);
        if (currentList.items.length === 0) { alert('Daftar belanja masih kosong!'); return; }

        let waText = `*Daftar: ${currentList.name}* 🛒\n\n`;
        let totalAnggaran = 0; let totalDibeli = 0;
        
        const itemsWithIndex = currentList.items.map(item => {
            const itemPrice = parseInt(item.price) || 0;
            totalAnggaran += itemPrice;
            if (item.completed) totalDibeli += itemPrice;
            return { ...item, price: itemPrice, category: item.category || 'Umum' };
        });
        
        categories.forEach(category => {
            const catItems = itemsWithIndex.filter(item => item.category === category);
            if (catItems.length > 0) {
                waText += `*_${category}_*\n`;
                catItems.forEach((item) => {
                    const statusIcon = item.completed ? '✅' : '⏳';
                    const priceText = item.price > 0 ? ` (${formatRupiah(item.price)})` : '';
                    waText += `- ${item.text}${priceText} ${statusIcon}\n`;
                });
                waText += `\n`;
            }
        });

        waText += `-----------------------\n*Total Estimasi:* ${formatRupiah(totalAnggaran)}\n*Sudah Dibeli:* ${formatRupiah(totalDibeli)}\n`;
        const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(waText)}`;
        window.open(waUrl, '_blank');
    });

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
        recognition.onerror = (event) => { micBtn.classList.remove('recording'); itemInput.placeholder = "Nama barang..."; if (event.error === 'not-allowed') alert('Izinkan mikrofon.'); };
        recognition.onend = () => { micBtn.classList.remove('recording'); itemInput.placeholder = "Nama barang..."; };
        micBtn.addEventListener('click', () => recognition.start());
    } else if (micBtn) { micBtn.style.display = 'none'; }

    // Init App
    renderDashboard();
});

// --- PWA: REGISTRASI SERVICE WORKER ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch((error) => console.log('ServiceWorker gagal:', error));
    });
}
