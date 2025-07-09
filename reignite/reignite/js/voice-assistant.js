/**
 * Enhanced Voice Assistant for Reignite Community Hub
 * Designed specifically for seniors with accessibility features
 */

class VoiceAssistant {
    constructor() {
        this.isListening = false;
        this.isSupported = this.checkSupport();
        this.currentUtterance = null;
        this.recognition = null;
        this.voices = [];
        this.settings = {
            speechRate: 0.8, // Slower for seniors
            speechPitch: 1,
            speechVolume: 1,
            language: 'en-US',
            voiceIndex: 0, // Default voice
            timeout: 10000 // 10 seconds timeout
        };
        
        this.commands = {
            'search': ['search for', 'find', 'look for'],
            'navigate': ['go to', 'open', 'show me'],
            'read': ['read this', 'read page', 'read content'],
            'help': ['help', 'what can you do', 'commands'],
            'events': ['events', 'activities', 'what\'s happening'],
            'forum': ['forum', 'community', 'discussions'],
            'stop': ['stop', 'quiet', 'silence']
        };
        
        this.init();
    }
    
    checkSupport() {
        return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    }
    
    init() {
        if (!this.isSupported) {
            console.warn('Speech recognition not supported');
            return;
        }
        
        this.setupSpeechRecognition();
        this.setupSpeechSynthesis();
        this.setupVoiceButtons();
        this.announceAvailability();
    }
    
    setupSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.maxAlternatives = 1;
        this.recognition.lang = this.settings.language;
        
        this.recognition.onstart = () => {
            this.isListening = true;
            this.updateVoiceButtonStates(true);
            this.speak("I'm listening. What can I help you with?");
        };
        
        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript.toLowerCase();
            console.log('Voice input:', transcript);
            this.processVoiceCommand(transcript);
        };
        
        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.handleSpeechError(event.error);
            this.isListening = false;
            this.updateVoiceButtonStates(false);
        };
        
        this.recognition.onend = () => {
            this.isListening = false;
            this.updateVoiceButtonStates(false);
        };
    }
    
    setupSpeechSynthesis() {
        if ('speechSynthesis' in window) {
            speechSynthesis.onvoiceschanged = () => {
                this.voices = speechSynthesis.getVoices();
                // Prefer female voices for better clarity
                const preferredVoice = this.voices.find(voice => 
                    voice.lang.includes('en') && voice.name.toLowerCase().includes('female')
                ) || this.voices.find(voice => voice.lang.includes('en')) || this.voices[0];
                
                if (preferredVoice) {
                    this.settings.voiceIndex = this.voices.indexOf(preferredVoice);
                }
            };
        }
    }
    
    setupVoiceButtons() {
        // Enhanced voice buttons with proper event handling
        document.querySelectorAll('.voice-button, [data-voice-action]').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const action = button.dataset.voiceAction || 'listen';
                this.handleVoiceButtonClick(button, action);
            });
            
            // Add keyboard accessibility
            button.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const action = button.dataset.voiceAction || 'listen';
                    this.handleVoiceButtonClick(button, action);
                }
            });
        });
    }
    
    handleVoiceButtonClick(button, action) {
        switch (action) {
            case 'listen':
                this.toggleListening();
                break;
            case 'read':
                this.readPageContent();
                break;
            case 'search':
                this.handleVoiceSearch(button);
                break;
            case 'help':
                this.provideHelp();
                break;
            default:
                this.toggleListening();
        }
    }
    
    toggleListening() {
        if (this.isListening) {
            this.stopListening();
        } else {
            this.startListening();
        }
    }
    
    startListening() {
        if (!this.isSupported) {
            this.speak("Sorry, voice recognition is not supported in your browser.");
            return;
        }
        
        try {
            this.recognition.start();
        } catch (error) {
            console.error('Failed to start speech recognition:', error);
            this.speak("Sorry, I couldn't start listening. Please try again.");
        }
    }
    
    stopListening() {
        if (this.recognition) {
            this.recognition.stop();
        }
        this.isListening = false;
        this.updateVoiceButtonStates(false);
    }
    
    processVoiceCommand(transcript) {
        const command = this.identifyCommand(transcript);
        
        switch (command.type) {
            case 'search':
                this.handleVoiceSearchCommand(command.query);
                break;
            case 'navigate':
                this.handleNavigationCommand(command.query);
                break;
            case 'read':
                this.readPageContent();
                break;
            case 'help':
                this.provideHelp();
                break;
            case 'events':
                this.navigateToEvents();
                break;
            case 'forum':
                this.navigateToForum();
                break;
            case 'stop':
                this.stopSpeaking();
                break;
            default:
                this.handleUnknownCommand(transcript);
        }
    }
    
    identifyCommand(transcript) {
        for (const [commandType, triggers] of Object.entries(this.commands)) {
            for (const trigger of triggers) {
                if (transcript.includes(trigger)) {
                    const query = transcript.replace(trigger, '').trim();
                    return { type: commandType, query };
                }
            }
        }
        return { type: 'unknown', query: transcript };
    }
    
    handleVoiceSearchCommand(query) {
        if (query) {
            this.speak(`Searching for ${query}`);
            const searchInput = document.querySelector('#searchInput, #mobileSearchInput');
            if (searchInput) {
                searchInput.value = query;
                searchInput.dispatchEvent(new Event('input'));
                // Trigger search if there's a search function
                setTimeout(() => {
                    searchInput.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter' }));
                }, 500);
            }
        } else {
            this.speak("What would you like to search for?");
        }
    }
    
    handleNavigationCommand(query) {
        const pages = {
            'home': 'homepage.html',
            'events': 'event_details.html',
            'forum': 'community_forum.html',
            'community': 'community_forum.html',
            'my events': 'my_enrolled_events.html',
            'wellness': 'wellness_resources.html'
        };
        
        const page = Object.keys(pages).find(key => query.includes(key));
        if (page) {
            this.speak(`Going to ${page}`);
            setTimeout(() => {
                window.location.href = pages[page];
            }, 1000);
        } else {
            this.speak("I'm not sure where you want to go. Try saying 'go to events' or 'go to forum'.");
        }
    }
    
    readPageContent() {
        const contentSelectors = [
            '#eventDescription',
            '.discussion-thread p',
            'main p',
            '.content p',
            'article p'
        ];
        
        let content = '';
        for (const selector of contentSelectors) {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
                content = Array.from(elements).map(el => el.textContent).join(' ');
                break;
            }
        }
        
        if (content) {
            this.speak(content);
        } else {
            // Fallback to page title and main headings
            const title = document.querySelector('h1, h2')?.textContent || 'Content';
            this.speak(`Reading ${title}. ${content || 'No additional content found on this page.'}`);
        }
    }
    
    provideHelp() {
        const helpText = `
            I'm your voice assistant. Here's what I can do:
            Say "search for" followed by what you want to find.
            Say "go to events" to see activities.
            Say "go to forum" for community discussions.
            Say "read this" to hear page content.
            Say "help" to hear this message again.
            Say "stop" to stop me from speaking.
        `;
        this.speak(helpText);
    }
    
    navigateToEvents() {
        this.speak("Taking you to events page");
        setTimeout(() => {
            window.location.href = 'event_details.html';
        }, 1000);
    }
    
    navigateToForum() {
        this.speak("Taking you to the community forum");
        setTimeout(() => {
            window.location.href = 'community_forum.html';
        }, 1000);
    }
    
    handleUnknownCommand(transcript) {
        this.speak(`I didn't understand "${transcript}". Say "help" to learn what I can do.`);
    }
    
    handleVoiceSearch(button) {
        const searchInput = button.closest('.relative')?.querySelector('input');
        if (searchInput) {
            this.speak("What would you like to search for?");
            setTimeout(() => {
                this.startListening();
                this.currentSearchInput = searchInput;
            }, 1000);
        }
    }
    
    speak(text) {
        if (!('speechSynthesis' in window)) {
            console.warn('Speech synthesis not supported');
            return;
        }
        
        // Stop any current speech
        this.stopSpeaking();
        
        this.currentUtterance = new SpeechSynthesisUtterance(text);
        this.currentUtterance.rate = this.settings.speechRate;
        this.currentUtterance.pitch = this.settings.speechPitch;
        this.currentUtterance.volume = this.settings.speechVolume;
        this.currentUtterance.lang = this.settings.language;
        
        if (this.voices.length > 0 && this.voices[this.settings.voiceIndex]) {
            this.currentUtterance.voice = this.voices[this.settings.voiceIndex];
        }
        
        this.currentUtterance.onend = () => {
            this.currentUtterance = null;
        };
        
        this.currentUtterance.onerror = (event) => {
            console.error('Speech synthesis error:', event);
            this.currentUtterance = null;
        };
        
        speechSynthesis.speak(this.currentUtterance);
    }
    
    stopSpeaking() {
        if (speechSynthesis.speaking) {
            speechSynthesis.cancel();
        }
        this.currentUtterance = null;
    }
    
    updateVoiceButtonStates(isListening) {
        document.querySelectorAll('.voice-button').forEach(button => {
            if (isListening) {
                button.style.backgroundColor = '#059669';
                button.style.transform = 'scale(1.05)';
                button.setAttribute('aria-label', 'Listening... Click to stop');
                button.title = 'Listening... Click to stop';
            } else {
                button.style.backgroundColor = '';
                button.style.transform = '';
                button.setAttribute('aria-label', 'Click to use voice assistant');
                button.title = 'Click to use voice assistant';
            }
        });
    }
    
    handleSpeechError(error) {
        let message = "Sorry, I had trouble with voice recognition. ";
        
        switch (error) {
            case 'no-speech':
                message += "I didn't hear anything. Please try again.";
                break;
            case 'audio-capture':
                message += "Please check your microphone.";
                break;
            case 'not-allowed':
                message += "Please allow microphone access to use voice features.";
                break;
            case 'network':
                message += "Please check your internet connection.";
                break;
            default:
                message += "Please try again.";
        }
        
        this.speak(message);
    }
    
    announceAvailability() {
        if (this.isSupported) {
            // Don't automatically announce to avoid startling users
            console.log('Voice assistant ready. Click any voice button to start.');
        }
    }
    
    // Public methods for external use
    readText(text) {
        this.speak(text);
    }
    
    isCurrentlySpeaking() {
        return speechSynthesis.speaking;
    }
    
    setSpeechRate(rate) {
        this.settings.speechRate = Math.max(0.1, Math.min(2, rate));
    }
    
    getSpeechRate() {
        return this.settings.speechRate;
    }
}

// Initialize voice assistant when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.voiceAssistant = new VoiceAssistant();
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VoiceAssistant;
}