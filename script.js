document.addEventListener('DOMContentLoaded', () => {
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

    const categories = ["Umum", "Sayuran & Buah", "Daging & Ikan", "Bumbu Dapur", "Minuman", "Kebersihan"];

    // Mengambil data utama & riwayat pencarian dari Local Storage
    let items = JSON.parse(localStorage.getItem('grocify_data')) || [];
    let itemHistory = JSON.parse(localStorage.getItem('grocify_history')) || [];

    const saveToLocalStorage = () => {
        localStorage.setItem('grocify_data', JSON.stringify(items));
    };

    // Fungsi menyimpan riwayat barang (Hanya jika belum ada di riwayat)
    const saveToHistory = (text) => {
        const cleanText = text.trim();
        // Cek agar tidak menduplikasi data yang sudah ada (tidak peduli huruf besar/kecil)
        const isExist = itemHistory.some(h => h.toLowerCase() === cleanText.toLowerCase());
        
        if (!isExist && cleanText !== '') {
            itemHistory.push(cleanText);
            localStorage.setItem('grocify_history', JSON.stringify(itemHistory));
        }
    };

    const formatRupiah = (num) => {
        return 'Rp ' + new Intl.NumberFormat('id-ID').format(num);
    };

    const renderList = () => {
        shoppingList.innerHTML = ''; 
        let totalAnggaran = 0;
        let totalDibeli = 0;

        const itemsWithIndex = items.map((item, index) => {
            const itemPrice = parseInt(item.price) || 0;
            totalAnggaran += itemPrice;
            if (item.completed) totalDibeli += itemPrice;

            return {
                ...item,
                price: itemPrice,
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
                    
                    li.innerHTML = `
                        <div class="item-left" onclick="toggleComplete(${item.originalIndex})">
                            <div class="checkbox">
                                <i class="fa-solid fa-check"></i>
                            </div>
                            <div class="item-info">
                                <span class="item-text">${item.text}</span>
                                ${item.price > 0 ? `<span class="item-price">${formatRupiah(item.price)}</span>` : ''}
                            </div>
                        </div>
                        <button class="delete-btn" onclick="deleteItem(${item.originalIndex})">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    `;
                    shoppingList.appendChild(li);
                });
            }
        });
    };

    const addItem = () => {
        const text = itemInput.value.trim();
        const price = parseInt(priceInput.value) || 0; 
        const category = categorySelect.value;
        
        if (text !== '') {
            items.push({ text: text, completed: false, category: category, price: price });
            saveToLocalStorage();
            saveToHistory(text); // Simpan ke dalam riwayat memori
            renderList();
            
            itemInput.value = ''; 
            priceInput.value = ''; 
            suggestionsContainer.innerHTML = ''; // Hilangkan chip setelah sukses
            itemInput.focus(); 
        }
    };

    window.toggleComplete = (index) => {
        items[index].completed = !items[index].completed;
        saveToLocalStorage();
        renderList();
    };

    window.deleteItem = (index) => {
        items.splice(index, 1);
        saveToLocalStorage();
        renderList();
    };

    clearCompletedBtn.addEventListener('click', () => {
        items = items.filter(item => !item.completed);
        saveToLocalStorage();
        renderList();
    });

    shareBtn.addEventListener('click', () => {
        if (items.length === 0) {
            alert('Daftar belanja masih kosong!');
            return;
        }

        let waText = '*Daftar Belanja Grocify* 🛒\n\n';
        let totalAnggaran = 0;
        let totalDibeli = 0;
        
        const itemsWithIndex = items.map(item => {
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

        waText += `-----------------------\n`;
        waText += `*Total Estimasi:* ${formatRupiah(totalAnggaran)}\n`;
        waText += `*Sudah Dibeli:* ${formatRupiah(totalDibeli)}\n`;

        const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(waText)}`;
        window.open(waUrl, '_blank');
    });

    // --- FITUR BARU: Event Listener untuk Auto-Suggestion ---
    itemInput.addEventListener('input', (e) => {
        const val = e.target.value.toLowerCase().trim();
        suggestionsContainer.innerHTML = ''; // Kosongkan saat mengetik
        
        if (val.length > 0) {
            // Cari data history yang mengandung huruf yang diketik
            const matches = itemHistory.filter(item => 
                item.toLowerCase().includes(val) && item.toLowerCase() !== val
            ).slice(0, 5); // Tampilkan maksimal 5 saran
            
            matches.forEach(match => {
                const chip = document.createElement('div');
                chip.className = 'suggestion-chip';
                chip.textContent = match; // Menampilkan nama barang dari riwayat
                
                // Ketika chip ditekan
                chip.addEventListener('click', () => {
                    itemInput.value = match;
                    suggestionsContainer.innerHTML = ''; // Sembunyikan chip
                    priceInput.focus(); // Arahkan pengguna agar langsung mengisi harga
                });
                
                suggestionsContainer.appendChild(chip);
            });
        }
    });

    addBtn.addEventListener('click', addItem);

    itemInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addItem();
    });
    priceInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addItem();
    });

    renderList();
});
