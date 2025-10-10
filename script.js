// Gestion du panier
class Cart {
    constructor() {
        this.items = JSON.parse(localStorage.getItem('pakoCheatsCart')) || [];
        this.updateCartDisplay();
    }

    addItem(product) {
        const existingItem = this.items.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.items.push({
                ...product,
                quantity: 1
            });
        }
        
        this.saveToLocalStorage();
        this.updateCartDisplay();
        this.showAddToCartAnimation();
    }

    removeItem(productId) {
        this.items = this.items.filter(item => item.id !== productId);
        this.saveToLocalStorage();
        this.updateCartDisplay();
    }

    updateQuantity(productId, quantity) {
        const item = this.items.find(item => item.id === productId);
        if (item) {
            item.quantity = quantity;
            if (item.quantity <= 0) {
                this.removeItem(productId);
            }
        }
        this.saveToLocalStorage();
        this.updateCartDisplay();
    }

    getTotal() {
        return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    getTotalItems() {
        return this.items.reduce((total, item) => total + item.quantity, 0);
    }

    saveToLocalStorage() {
        localStorage.setItem('pakoCheatsCart', JSON.stringify(this.items));
    }

    updateCartDisplay() {
        const cartCount = document.querySelector('.cart-count');
        if (cartCount) {
            cartCount.textContent = this.getTotalItems();
        }
    }

    showAddToCartAnimation() {
        // Animation visuelle quand un produit est ajouté
        const event = new CustomEvent('cartUpdated');
        document.dispatchEvent(event);
    }

    clear() {
        this.items = [];
        this.saveToLocalStorage();
        this.updateCartDisplay();
    }
}

// Initialisation du panier
const cart = new Cart();

// Gestion de la modal du panier
function setupCartModal() {
    const cartIcon = document.getElementById('cartIcon');
    const cartModal = document.getElementById('cartModal');
    const closeModal = document.querySelector('.close');
    const checkoutBtn = document.getElementById('checkoutBtn');

    if (cartIcon && cartModal) {
        cartIcon.addEventListener('click', () => {
            showCartModal();
        });

        closeModal.addEventListener('click', () => {
            cartModal.style.display = 'none';
        });

        window.addEventListener('click', (e) => {
            if (e.target === cartModal) {
                cartModal.style.display = 'none';
            }
        });
    }

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (cart.items.length > 0) {
                window.location.href = 'purchase.html';
            } else {
                alert('Votre panier est vide');
            }
        });
    }
}

function showCartModal() {
    const cartModal = document.getElementById('cartModal');
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');

    if (cartModal && cartItems) {
        cartItems.innerHTML = '';
        
        if (cart.items.length === 0) {
            cartItems.innerHTML = '<p class="empty-cart">Votre panier est vide</p>';
        } else {
            cart.items.forEach(item => {
                const itemElement = document.createElement('div');
                itemElement.className = 'cart-item';
                itemElement.innerHTML = `
                    <div>
                        <h4>${item.name}</h4>
                        <p>${item.price.toFixed(2)}€ x ${item.quantity}</p>
                    </div>
                    <div>
                        <button class="btn-quantity" data-id="${item.id}" data-action="decrease">-</button>
                        <span>${item.quantity}</span>
                        <button class="btn-quantity" data-id="${item.id}" data-action="increase">+</button>
                        <button class="btn-remove" data-id="${item.id}">×</button>
                    </div>
                `;
                cartItems.appendChild(itemElement);
            });

            // Ajouter les événements pour les boutons
            document.querySelectorAll('.btn-quantity').forEach(button => {
                button.addEventListener('click', (e) => {
                    const productId = parseInt(e.target.dataset.id);
                    const action = e.target.dataset.action;
                    const item = cart.items.find(item => item.id === productId);
                    
                    if (item) {
                        if (action === 'increase') {
                            cart.updateQuantity(productId, item.quantity + 1);
                        } else if (action === 'decrease') {
                            cart.updateQuantity(productId, item.quantity - 1);
                        }
                    }
                });
            });

            document.querySelectorAll('.btn-remove').forEach(button => {
                button.addEventListener('click', (e) => {
                    const productId = parseInt(e.target.dataset.id);
                    cart.removeItem(productId);
                });
            });
        }

        if (cartTotal) {
            cartTotal.textContent = cart.getTotal().toFixed(2) + '€';
        }

        cartModal.style.display = 'flex';
    }
}

// Gestion des boutons "Ajouter au panier"
function setupAddToCartButtons() {
    document.querySelectorAll('.btn-add-cart').forEach(button => {
        button.addEventListener('click', (e) => {
            const product = {
                id: parseInt(e.target.dataset.id),
                name: e.target.dataset.name,
                price: parseFloat(e.target.dataset.price)
            };
            
            cart.addItem(product);
            
            // Animation du bouton
            const originalText = e.target.textContent;
            e.target.textContent = '✓ Ajouté !';
            e.target.style.background = 'linear-gradient(45deg, #2ecc71, #27ae60)';
            
            setTimeout(() => {
                e.target.textContent = originalText;
                e.target.style.background = '';
            }, 2000);
        });
    });
}

// Génération du code de transaction unique
function generateTransactionCode() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `PAKO-${timestamp}-${random}`.toUpperCase();
}

// Gestion de la page de paiement
function setupPurchasePage() {
    const orderItems = document.getElementById('orderItems');
    const orderTotal = document.getElementById('orderTotal');
    const transactionCode = document.getElementById('transactionCode');
    const transactionCodeDisplay = document.getElementById('transactionCodeDisplay');
    const paymentAmount = document.getElementById('paymentAmount');
    const bankAmount = document.getElementById('bankAmount');
    const confirmPayment = document.getElementById('confirmPayment');

    if (orderItems && cart.items.length > 0) {
        orderItems.innerHTML = '';
        cart.items.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'cart-item';
            itemElement.innerHTML = `
                <div>
                    <h4>${item.name}</h4>
                    <p>Quantité: ${item.quantity}</p>
                </div>
                <div>${(item.price * item.quantity).toFixed(2)}€</div>
            `;
            orderItems.appendChild(itemElement);
        });

        const total = cart.getTotal();
        if (orderTotal) orderTotal.textContent = total.toFixed(2) + '€';
        if (paymentAmount) paymentAmount.textContent = total.toFixed(2) + '€';
        if (bankAmount) bankAmount.textContent = total.toFixed(2) + '€';

        // Générer et afficher le code de transaction
        const code = generateTransactionCode();
        if (transactionCode) transactionCode.textContent = code;
        if (transactionCodeDisplay) transactionCodeDisplay.textContent = code;

        // Sauvegarder le code de transaction
        localStorage.setItem('transactionCode', code);
        localStorage.setItem('transactionAmount', total.toFixed(2));
    } else if (orderItems && cart.items.length === 0) {
        orderItems.innerHTML = '<p>Votre panier est vide. <a href="panels.html">Retourner à la boutique</a></p>';
    }

    if (confirmPayment) {
        confirmPayment.addEventListener('click', () => {
            if (cart.items.length > 0) {
                const code = localStorage.getItem('transactionCode');
                const amount = localStorage.getItem('transactionAmount');
                
                alert(`Paiement confirmé!\n\nCode de transaction: ${code}\nMontant: ${amount}€\n\nVeuillez envoyer la capture d'écran de votre virement sur notre Discord. Notre équipe traitera votre commande dans les 2 heures.`);
                
                // Vider le panier après confirmation
                cart.clear();
                localStorage.removeItem('transactionCode');
                localStorage.removeItem('transactionAmount');
                
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 3000);
            }
        });
    }
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    setupAddToCartButtons();
    setupCartModal();
    
    // Vérifier si on est sur la page de paiement
    if (window.location.pathname.includes('purchase.html')) {
        setupPurchasePage();
    }
    
    // Animation de fade-in au scroll
    const fadeElements = document.querySelectorAll('.product-card, .feature-card');
    
    const fadeInOnScroll = function() {
        fadeElements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const elementVisible = 150;
            
            if (elementTop < window.innerHeight - elementVisible) {
                element.style.opacity = "1";
                element.style.transform = "translateY(0)";
            }
        });
    };
    
    // Set initial state
    fadeElements.forEach(element => {
        element.style.opacity = "0";
        element.style.transform = "translateY(20px)";
        element.style.transition = "opacity 0.8s ease, transform 0.8s ease";
    });
    
    window.addEventListener('scroll', fadeInOnScroll);
    fadeInOnScroll(); // Initial check
});

// Gestion des onglets de navigation
function setActiveNav() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('nav a').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        }
    });
}

// Appeler cette fonction après le chargement de la page
document.addEventListener('DOMContentLoaded', setActiveNav);