import { Container, Graphics, Text, Sprite, Assets } from '../../pixi.min.mjs';
import { exampleCards } from './cardExamples.js';

export class DeckManager {
    constructor(isBot = false) {
        this.isBot = isBot;
        this.deck = [];
        this.hand = [];
        this.playedCards = [];
        this.deckContainer = new Container();
        this.handContainer = new Container();
        this.playAreaContainer = new Container();
        this.cardsPlayedThisTurn = 0;
        this.isMyTurn = !isBot;
        
        // Load card textures before initializing
        this.initializeGame();
    }

    async initializeGame() {
        // Load all card textures first
        await this.loadCardTextures();
        this.initializeDeck();
        this.createDeckVisuals();
    }

    async loadCardTextures() {
        // Load all unique card images
        const uniqueImages = new Set(Object.values(exampleCards).map(card => card.imageUrl));
        for (const imageUrl of uniqueImages) {
            if (imageUrl) {
                try {
                    await Assets.load(imageUrl);
                } catch (error) {
                    console.error('Error loading texture:', imageUrl, error);
                }
            }
        }
    }

    initializeDeck() {
        // Convert example cards object to array
        const cardPool = Object.values(exampleCards);
        
        // Create 60 cards deck with random cards from pool
        for (let i = 0; i < 60; i++) {
            const randomCard = cardPool[Math.floor(Math.random() * cardPool.length)];
            this.deck.push({ ...randomCard }); // Clone the card
        }
        
        // Shuffle the deck
        this.shuffle();
    }

    shuffle() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    createDeckVisuals() {
        // Create deck visual representation
        const deckBack = new Graphics()
            .rect(0, 0, 120, 160)
            .fill({ color: 0x3a1f0f })
            .stroke({ width: 2, color: 0x8b7355 });

        // Add card count text
        this.cardCountText = new Text({
            text: this.deck.length.toString(),
            style: { fill: 0xffffff, fontSize: 20 }
        });
        this.cardCountText.x = 50;
        this.cardCountText.y = 170;

        this.deckContainer.addChild(deckBack);
        this.deckContainer.addChild(this.cardCountText);

        // Add interactivity if it's player's deck
        if (!this.isBot) {
            deckBack.eventMode = 'static';
            deckBack.cursor = 'pointer';
            deckBack.on('pointerdown', () => this.drawCard());
        }
    }

    createCardVisual(card, inHand = true) {
        const cardContainer = new Container();
        
        // Card background
        const cardVisual = new Graphics()
            .rect(0, 0, 120, 160)
            .fill({ color: this.isBot && inHand ? 0x3a1f0f : 0xf0d890 })
            .stroke({ width: 2, color: 0x8b7355 });

        cardContainer.addChild(cardVisual);

        // Show card details if it's player's card or card is played
        if (!this.isBot || !inHand) {
            // Add card image
            if (card.imageUrl) {
                try {
                    const texture = Assets.get(card.imageUrl);
                    const cardImage = new Sprite(texture);
                    cardImage.width = 110;  // Slightly smaller than card
                    cardImage.height = 90;  // Leave room for text
                    cardImage.x = 5;        // Center in card
                    cardImage.y = 25;       // Below title
                    cardContainer.addChild(cardImage);
                } catch (error) {
                    console.error('Error creating card sprite:', error);
                }
            }

            // Add card name
            const nameText = new Text({
                text: card.name,
                style: { 
                    fill: 0x000000,
                    fontSize: 14,
                    wordWrap: true,
                    wordWrapWidth: 110
                }
            });
            nameText.x = 5;
            nameText.y = 5;
            cardContainer.addChild(nameText);

            // Add card type
            const typeText = new Text({
                text: card.type,
                style: { fill: 0x666666, fontSize: 12 }
            });
            typeText.x = 5;
            typeText.y = 140;
            cardContainer.addChild(typeText);
        }

        // Add interactivity for player's hand cards only
        if (!this.isBot && inHand) {
            cardContainer.eventMode = 'static';
            cardContainer.cursor = 'pointer';
            
            // Hover effects
            cardContainer.on('pointerover', () => {
                cardContainer.y = -20;
            });
            
            cardContainer.on('pointerout', () => {
                cardContainer.y = 0;
            });
            
            // Click to play card
            cardContainer.on('pointerdown', () => this.playCard(card, cardContainer));
        }

        cardContainer.cardData = card;
        return cardContainer;
    }

    drawCard() {
        if (this.deck.length === 0) return;

        const card = this.deck.pop();
        this.hand.push(card);

        // Update deck count
        this.cardCountText.text = this.deck.length.toString();

        // Create and position new card in hand
        const cardVisual = this.createCardVisual(card, true);
        cardVisual.x = (this.hand.length - 1) * 130;
        cardVisual.y = 0;
        this.handContainer.addChild(cardVisual);
    }

    playCard(card, cardVisual) {
        if (!this.isMyTurn || this.cardsPlayedThisTurn >= 2) return;

        const cardIndex = this.hand.indexOf(card);
        if (cardIndex > -1) {
            // Remove card from hand
            this.hand.splice(cardIndex, 1);
            this.playedCards.push(card);
            this.handContainer.removeChild(cardVisual);

            // Add card to play area
            const playedCardVisual = this.createCardVisual(card, false);
            playedCardVisual.x = (this.playedCards.length - 1) * 130;
            playedCardVisual.y = 0;
            this.playAreaContainer.addChild(playedCardVisual);

            // Rearrange remaining cards in hand
            this.rearrangeHand();

            this.cardsPlayedThisTurn++;
            if (this.cardsPlayedThisTurn >= 2) {
                this.endTurn();
            }
        }
    }

    rearrangeHand() {
        // Reposition all cards in hand
        for (let i = 0; i < this.handContainer.children.length; i++) {
            const card = this.handContainer.children[i];
            card.x = i * 130;
        }
    }

    startTurn() {
        this.isMyTurn = true;
        this.cardsPlayedThisTurn = 0;
        
        // Draw a card at the start of turn
        this.drawCard();

        if (this.isBot) {
            // Bot plays after a short delay
            setTimeout(() => this.playBotTurn(), 1000);
        }
    }

    endTurn() {
        this.isMyTurn = false;
        this.cardsPlayedThisTurn = 0;
        
        // Notify game manager that turn is ended
        if (this.onTurnEnd) {
            this.onTurnEnd();
        }
    }

    playBotTurn() {
        // Bot plays up to 2 random cards
        const playCard = () => {
            if (this.hand.length > 0 && this.cardsPlayedThisTurn < 2) {
                // Select random card from hand
                const randomIndex = Math.floor(Math.random() * this.hand.length);
                const card = this.hand[randomIndex];
                const cardVisual = this.handContainer.children[randomIndex];
                
                this.playCard(card, cardVisual);

                // Schedule next card play
                if (this.cardsPlayedThisTurn < 2) {
                    setTimeout(playCard, 1000);
                }
            }
        };

        playCard();
    }
} 