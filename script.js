document.addEventListener('DOMContentLoaded', () => {
    const itemInput = document.getElementById('item-input');
    const addBtn = document.getElementById('add-btn');
    const shoppingList = document.getElementById('shopping-list');

    // Mengambil data dari Local Storage saat aplikasi dibuka
    let items = JSON.parse(localStorage.getItem('grocify_data')) || [];

    // Fungsi otomatis menyimpan data terbaru ke Local Storage
    const saveToLocalStorage = () => {
        localStorage.setItem('grocify_data', JSON.stringify(items));
    };

    // Fungsi untuk menampilkan daftar ke layar
    const renderList = () => {
        shoppingList.innerHTML = ''; // Kosongkan list dulu
        
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

    // Fungsi menambah barang baru
    const addItem = () => {
        const text = itemInput.value.trim();
        if (text !== '') {
            // Tambahkan di urutan teratas (unshift) atau terbawah (push)
            items.push({ text: text, completed: false });
            saveToLocalStorage();
            renderList();
            itemInput.value = ''; // Kosongkan input
            itemInput.focus(); // Kembalikan kursor ke input
        }
    };

    // Fungsi menandai barang sudah dibeli
    window.toggleComplete = (index) => {
        items[index].completed = !items[index].completed;
        saveToLocalStorage();
        renderList();
    };

    // Fungsi menghapus barang
    window.deleteItem = (index) => {
        items.splice(index, 1);
        saveToLocalStorage();
        renderList();
    };

    // Eksekusi ketika tombol '+' diklik
    addBtn.addEventListener('click', addItem);

    // Eksekusi ketika tombol 'Enter' pada keyboard HP ditekan
    itemInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addItem();
    });

    // Tampilkan list saat pertama kali halaman dimuat
    renderList();
});
