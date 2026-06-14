document.addEventListener('DOMContentLoaded', () => {
    const itemInput = document.getElementById('item-input');
    const addBtn = document.getElementById('add-btn');
    const shoppingList = document.getElementById('shopping-list');
    const clearCompletedBtn = document.getElementById('clear-completed-btn');
    const shareBtn = document.getElementById('share-btn');

    let items = JSON.parse(localStorage.getItem('grocify_data')) || [];

    const saveToLocalStorage = () => {
        localStorage.setItem('grocify_data', JSON.stringify(items));
    };

    const renderList = () => {
        shoppingList.innerHTML = ''; 
        
        items.forEach((item, index) => {
            const li = document.createElement('li');
            li.className = `list-item ${item.completed ? 'completed' : ''}`;
            
            li.innerHTML = `
                <div class="item-left" onclick="toggleComplete(${index})">
                    <div class="checkbox">
                        <i class="fa-solid fa-check"></i>
                    </div>
                    <span class="item-text">${item.text}</span>
                </div>
                <button class="delete-btn" onclick="deleteItem(${index})">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            `;
            shoppingList.appendChild(li);
        });
    };

    const addItem = () => {
        const text = itemInput.value.trim();
        if (text !== '') {
            items.push({ text: text, completed: false });
            saveToLocalStorage();
            renderList();
            itemInput.value = ''; 
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

    // --- FITUR BARU: Hapus Semua yang Selesai ---
    clearCompletedBtn.addEventListener('click', () => {
        // Filter: Hanya simpan item yang belum selesai (completed === false)
        items = items.filter(item => !item.completed);
        saveToLocalStorage();
        renderList();
    });

    // --- FITUR BARU: Bagikan ke WhatsApp ---
    shareBtn.addEventListener('click', () => {
        if (items.length === 0) {
            alert('Daftar belanja masih kosong!');
            return;
        }

        let waText = '*Daftar Belanja Grocify* 🛒\n\n';
        items.forEach((item, index) => {
            // Beri emoji centang jika sudah, jam pasir jika belum
            const statusIcon = item.completed ? '✅' : '⏳';
            waText += `${index + 1}. ${item.text} ${statusIcon}\n`;
        });

        // Buka WhatsApp (Bisa di WA Web atau Aplikasi WA di HP)
        const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(waText)}`;
        window.open(waUrl, '_blank');
    });

    addBtn.addEventListener('click', addItem);

    itemInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addItem();
    });

    renderList();
});
