const API_BASE = 'http://127.0.0.1:5000/api';

// --- Chat Bot Logic ---
const chatToggleBtn = document.getElementById('chatToggleBtn');
const chatWindow = document.getElementById('chatWindow');
const closeChatBtn = document.getElementById('closeChatBtn');
const chatbox = document.getElementById('chatbox');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const typingIndicator = document.getElementById('typingIndicator');

// Toggle Chat Window
if (chatToggleBtn && chatWindow && closeChatBtn) {
    chatToggleBtn.addEventListener('click', () => {
        chatWindow.classList.toggle('open');
        if (chatWindow.classList.contains('open')) {
            userInput.focus();
        }
    });

    closeChatBtn.addEventListener('click', () => {
        chatWindow.classList.remove('open');
    });
}

// Send Message
async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    // Add user message to UI
    appendMessage(message, 'user');
    userInput.value = '';

    // Show typing indicator
    typingIndicator.style.display = 'block';

    try {
        const response = await fetch(`${API_BASE}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });

        const data = await response.json();
        
        // Hide typing indicator
        typingIndicator.style.display = 'none';
        
        if (response.ok) {
            // Replace newlines with <br> for HTML rendering
            const formattedReply = data.reply.replace(/\\n/g, '<br>');
            appendMessage(formattedReply, 'bot');
        } else {
            appendMessage('Sorry, I am having trouble connecting to the server.', 'bot');
        }
    } catch (error) {
        typingIndicator.style.display = 'none';
        appendMessage('Error: Could not reach the chatbot service.', 'bot');
        console.error(error);
    }
}

function appendMessage(text, sender) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', sender);
    msgDiv.innerHTML = text; // using innerHTML to support <br> from bot
    
    // Insert before typing indicator
    chatbox.insertBefore(msgDiv, typingIndicator);
    
    // Scroll to bottom
    chatbox.scrollTop = chatbox.scrollHeight;
}

if (sendBtn && userInput) {
    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
}


// --- Menu & Cart Logic ---
let cart = [];
const menuContainer = document.getElementById('menuContainer');
const cartCount = document.getElementById('cartCount');
const cartSection = document.getElementById('cartSection');
const cartItemsContainer = document.getElementById('cartItemsContainer');
const cartTotalSum = document.getElementById('cartTotalSum');
const openCartBtn = document.getElementById('openCartBtn');
const closeCartBtn = document.getElementById('closeCartBtn');
const placeOrderBtn = document.getElementById('placeOrderBtn');
const custName = document.getElementById('custName');
const custPhone = document.getElementById('custPhone');
const toastMsg = document.getElementById('toastMsg');

function showToast(message) {
    toastMsg.textContent = message;
    toastMsg.classList.add('show');
    setTimeout(() => {
        toastMsg.classList.remove('show');
    }, 3000);
}

// Load Menu
async function loadMenu() {
    if (!menuContainer) return; // Only execute on menu page
    
    try {
        const response = await fetch(`${API_BASE}/menu`);
        const items = await response.json();
        
        menuContainer.innerHTML = '';
        items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'coffee-card';
            card.innerHTML = `
                <div class="card-header">
                    <span class="card-title">${item.name}</span>
                    <span class="card-price">$${item.price.toFixed(2)}</span>
                </div>
                <p class="card-desc">${item.description}</p>
                <button class="btn-add" onclick="addToCart(${item.id}, '${item.name}', ${item.price})">Add to Cart</button>
            `;
            menuContainer.appendChild(card);
        });
    } catch (error) {
        console.error(error);
        menuContainer.innerHTML = '<p>Error loading menu. Is the backend running?</p>';
    }
}

// Cart functionality
window.addToCart = function(id, name, price) {
    const existingIndex = cart.findIndex(item => item.id === id);
    if (existingIndex > -1) {
        cart[existingIndex].qty += 1;
    } else {
        cart.push({ id, name, price, qty: 1 });
    }
    updateCartUI();
    showToast(`${name} added to cart!`);
    
    // Open cart automatically when item added
    if (cartSection && !cartSection.classList.contains('active')) {
        cartSection.classList.add('active');
    }
};

function updateCartUI() {
    if (!cartCount || !cartItemsContainer || !cartTotalSum) return;
    
    const count = cart.reduce((sum, item) => sum + item.qty, 0);
    cartCount.textContent = count;
    
    cartItemsContainer.innerHTML = '';
    let total = 0;
    
    cart.forEach(item => {
        const itemTotal = item.price * item.qty;
        total += itemTotal;
        
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <span>${item.name} x${item.qty}</span>
            <span>$${itemTotal.toFixed(2)}</span>
            <i class="fa-solid fa-trash" style="cursor:pointer; color:#ccc;" onclick="removeFromCart(${item.id})"></i>
        `;
        cartItemsContainer.appendChild(div);
    });
    
    cartTotalSum.textContent = total.toFixed(2);
}

window.removeFromCart = function(id) {
    cart = cart.filter(item => item.id !== id);
    updateCartUI();
};

if (openCartBtn && closeCartBtn && cartSection) {
    openCartBtn.addEventListener('click', (e) => {
        e.preventDefault();
        cartSection.classList.toggle('active');
    });
    
    closeCartBtn.addEventListener('click', () => {
        cartSection.classList.remove('active');
    });
}

// Checkout functionality
if (placeOrderBtn) {
    placeOrderBtn.addEventListener('click', async () => {
        if (cart.length === 0) {
            showToast('Your cart is empty!');
            return;
        }
        
        if (!custName.value.trim()) {
            showToast('Please enter your name.');
            return;
        }

        const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
        
        const orderData = {
            customer_name: custName.value.trim(),
            customer_phone: custPhone.value.trim(),
            items: cart.map(i => ({ id: i.id, name: i.name, quantity: i.qty })),
            total_price: total
        };
        
        try {
            const response = await fetch(`${API_BASE}/order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });
            
            const data = await response.json();
            
            if (response.ok) {
                showToast('Order placed successfully! Order ID: ' + data.order_id);
                // Clear cart
                cart = [];
                updateCartUI();
                custName.value = '';
                custPhone.value = '';
                cartSection.classList.remove('active');
            } else {
                showToast('Error placing order: ' + data.error);
            }
        } catch (error) {
            console.error(error);
            showToast('Failed to reach server to place order.');
        }
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadMenu();
});
