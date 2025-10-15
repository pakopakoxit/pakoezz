// Elaraki GPT - Application de Chat IA
// Design Extraordinaire avec les couleurs exactes d'El Araki International School

class ElarakiGPT {
    constructor() {
        this.conversation = [];
        this.isLoading = false;
        
        // Éléments DOM
        this.chatMessages = document.getElementById('chat-messages');
        this.messageInput = document.getElementById('message-input');
        this.sendBtn = document.getElementById('send-btn');
        this.clearBtn = document.getElementById('clear-btn');
        this.aboutBtn = document.getElementById('about-btn');
        this.contactBtn = document.getElementById('contact-btn');
        this.aboutModal = document.getElementById('about-modal');
        this.contactModal = document.getElementById('contact-modal');
        this.closeAboutModal = document.getElementById('close-about-modal');
        this.closeContactModal = document.getElementById('close-contact-modal');
        this.loadingIndicator = document.getElementById('loading-indicator');
        this.welcomeSection = document.getElementById('welcome-section');
        this.chatContainer = document.getElementById('chat-container');
        this.quickActions = document.getElementById('quick-actions');
        
        // Configuration OpenRouter API
        this.apiKey = "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";
        this.apiUrl = "https://openrouter.ai/api/v1/chat/completions";
        this.model = "openai/gpt-3.5-turbo"; // ou "openai/gpt-4", "meta-llama/llama-3.1-8b-instruct", etc.
        
        this.init();
    }
    
    init() {
        // Écouteurs d'événements
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        this.clearBtn.addEventListener('click', () => this.clearConversation());
        this.aboutBtn.addEventListener('click', () => this.showModal(this.aboutModal));
        this.contactBtn.addEventListener('click', () => this.showModal(this.contactModal));
        this.closeAboutModal.addEventListener('click', () => this.hideModal(this.aboutModal));
        this.closeContactModal.addEventListener('click', () => this.hideModal(this.contactModal));
        
        // Fermer les modales en cliquant à l'extérieur
        [this.aboutModal, this.contactModal].forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal || e.target.classList.contains('modal-backdrop')) {
                    this.hideModal(modal);
                }
            });
        });
        
        // Boutons d'actions rapides
        document.querySelectorAll('.quick-action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const prompt = e.target.getAttribute('data-prompt') || 
                             e.target.closest('.quick-action-btn').getAttribute('data-prompt');
                this.messageInput.value = prompt;
                this.sendMessage();
            });
        });
        
        // Redimensionnement automatique de la zone de texte
        this.messageInput.addEventListener('input', () => {
            this.autoResizeTextarea();
        });
        
        // Charger la conversation depuis le localStorage
        this.loadConversation();
        
        // Afficher les actions rapides après un délai
        setTimeout(() => {
            this.quickActions.classList.add('show');
        }, 1000);
    }
    
    autoResizeTextarea() {
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
    }
    
    async sendMessage() {
        const message = this.messageInput.value.trim();
        
        if (!message || this.isLoading) return;
        
        // Cacher la section de bienvenue au premier message
        if (this.conversation.length === 0) {
            this.hideWelcomeSection();
        }
        
        // Ajouter le message utilisateur à la conversation
        this.addMessage('user', message);
        this.messageInput.value = '';
        this.autoResizeTextarea();
        
        // Afficher l'indicateur de chargement
        this.setLoading(true);
        
        try {
            // Obtenir la réponse de l'IA
            const response = await this.getAIResponse(message);
            
            // Ajouter le message de l'assistant à la conversation
            this.addMessage('assistant', response);
            
            // Sauvegarder la conversation dans le localStorage
            this.saveConversation();
        } catch (error) {
            console.error('Erreur:', error);
            this.addMessage('assistant', 'Désolé, j\'ai rencontré une erreur. Veuillez réessayer. Erreur: ' + error.message);
        } finally {
            this.setLoading(false);
        }
    }
    
    async getAIResponse(userMessage) {
        // Ajouter le message utilisateur au tableau de conversation pour l'API
        this.conversation.push({ role: "user", content: userMessage });
        
        // Préparer la requête OpenRouter API
        const requestBody = {
            model: this.model,
            messages: this.conversation,
            max_tokens: 1000,
            temperature: 0.7,
            stream: false
        };
        
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
            'HTTP-Referer': 'https://elaraki.ac.ma', // URL de votre site
            'X-Title': 'Elaraki GPT' // Nom de votre application
        };
        
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Erreur API ${response.status}: ${errorText}`);
            }
            
            const data = await response.json();
            
            // Vérifier la structure de la réponse OpenRouter
            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                throw new Error('Format de réponse API invalide');
            }
            
            // Extraire la réponse de l'assistant
            const assistantMessage = data.choices[0].message.content;
            
            // Ajouter le message de l'assistant au tableau de conversation
            this.conversation.push({ role: "assistant", content: assistantMessage });
            
            return assistantMessage;
        } catch (error) {
            console.error('Erreur API:', error);
            throw error;
        }
    }

    // Fonction pour envoyer des images (fonctionnalité avancée)
    async sendMessageWithImage(message, imageUrl) {
        if (!message || this.isLoading) return;
        
        // Cacher la section de bienvenue au premier message
        if (this.conversation.length === 0) {
            this.hideWelcomeSection();
        }
        
        // Ajouter le message utilisateur à la conversation
        this.addMessage('user', message + ' [Image]');
        this.setLoading(true);
        
        try {
            // Préparer le message avec image pour OpenRouter
            const messagesWithImage = [
                ...this.conversation,
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: message
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: imageUrl
                            }
                        }
                    ]
                }
            ];
            
            const requestBody = {
                model: this.model,
                messages: messagesWithImage,
                max_tokens: 1000,
                temperature: 0.7
            };
            
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
                'HTTP-Referer': 'https://elaraki.ac.ma',
                'X-Title': 'Elaraki GPT'
            };
            
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                throw new Error(`Erreur API ${response.status}`);
            }
            
            const data = await response.json();
            const assistantMessage = data.choices[0].message.content;
            
            // Mettre à jour la conversation
            this.conversation.push({ 
                role: "user", 
                content: message 
            });
            this.conversation.push({ 
                role: "assistant", 
                content: assistantMessage 
            });
            
            this.addMessage('assistant', assistantMessage);
            this.saveConversation();
            
        } catch (error) {
            console.error('Erreur:', error);
            this.addMessage('assistant', 'Désolé, erreur lors du traitement de l\'image.');
        } finally {
            this.setLoading(false);
        }
    }
    
    addMessage(role, content) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${role}`;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        // Formater le contenu avec des sauts de ligne
        const formattedContent = content.replace(/\n/g, '<br>');
        messageContent.innerHTML = formattedContent;
        
        const timestamp = document.createElement('div');
        timestamp.className = 'message-timestamp';
        timestamp.textContent = new Date().toLocaleTimeString('fr-FR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        messageContent.appendChild(timestamp);
        messageElement.appendChild(messageContent);
        
        this.chatMessages.appendChild(messageElement);
        this.scrollToBottom();
    }
    
    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
    
    setLoading(loading) {
        this.isLoading = loading;
        this.sendBtn.disabled = loading;
        
        if (loading) {
            this.loadingIndicator.classList.add('show');
            // Mettre à jour l'indicateur AI
            const aiDot = document.querySelector('.ai-dot');
            const aiText = document.querySelector('.ai-indicator span');
            if (aiDot) aiDot.style.background = '#dc2626';
            if (aiText) aiText.textContent = 'Elaraki GPT réfléchit...';
        } else {
            this.loadingIndicator.classList.remove('show');
            // Remettre l'indicateur AI à normal
            const aiDot = document.querySelector('.ai-dot');
            const aiText = document.querySelector('.ai-indicator span');
            if (aiDot) aiDot.style.background = '#059669';
            if (aiText) aiText.textContent = 'Elaraki GPT est prêt';
        }
    }
    
    hideWelcomeSection() {
        this.welcomeSection.classList.add('hidden');
        this.chatContainer.classList.remove('hidden');
    }
    
    showWelcomeSection() {
        this.welcomeSection.classList.remove('hidden');
        this.chatContainer.classList.add('hidden');
    }
    
    clearConversation() {
        this.conversation = [];
        this.chatMessages.innerHTML = '';
        this.showWelcomeSection();
        
        // Effacer le localStorage
        localStorage.removeItem('elarakiGPTConversation');
    }
    
    showModal(modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
    
    hideModal(modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
    
    saveConversation() {
        if (this.conversation.length > 0) {
            localStorage.setItem('elarakiGPTConversation', JSON.stringify(this.conversation));
        }
    }
    
    loadConversation() {
        const savedConversation = localStorage.getItem('elarakiGPTConversation');
        
        if (savedConversation) {
            try {
                this.conversation = JSON.parse(savedConversation);
                
                // Cacher la section de bienvenue
                this.hideWelcomeSection();
                
                // Afficher la conversation sauvegardée
                this.conversation.forEach(message => {
                    this.addMessage(message.role, message.content);
                });
            } catch (error) {
                console.error('Erreur lors du chargement de la conversation:', error);
                this.clearConversation();
            }
        }
    }

    // Méthode pour changer le modèle AI
    setModel(newModel) {
        this.model = newModel;
        console.log(`Modèle changé pour: ${newModel}`);
    }

    // Méthode pour obtenir les informations du modèle actuel
    getCurrentModel() {
        return this.model;
    }
}

// Initialiser l'application lorsque le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    const elarakiGPT = new ElarakiGPT();
    
    // Exposer l'instance globalement pour le débogage
    window.elarakiGPT = elarakiGPT;
});

// Gérer le redimensionnement de la fenêtre
window.addEventListener('resize', () => {
    const messageInput = document.getElementById('message-input');
    if (messageInput) {
        messageInput.style.height = 'auto';
        messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
    }
});

// Fonction utilitaire pour tester la connexion API
async function testAPIConnection() {
    try {
        const response = await fetch('https://openrouter.ai/api/v1/models', {
            headers: {
                'Authorization': 'Bearer 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'
            }
        });
        
        if (response.ok) {
            console.log('✅ Connexion OpenRouter réussie');
            return true;
        } else {
            console.error('❌ Erreur de connexion OpenRouter');
            return false;
        }
    } catch (error) {
        console.error('❌ Erreur de connexion:', error);
        return false;
    }
}

// Tester la connexion au chargement
window.addEventListener('load', () => {
    setTimeout(testAPIConnection, 1000);
});
