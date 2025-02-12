export class GameManager {
    constructor(playerDeck, botDeck) {
        this.playerDeck = playerDeck;
        this.botDeck = botDeck;
        this.currentPlayer = playerDeck;

        // Set up turn end callbacks
        this.playerDeck.onTurnEnd = () => this.switchTurn();
        this.botDeck.onTurnEnd = () => this.switchTurn();
    }

    switchTurn() {
        // Switch current player
        this.currentPlayer = 
            this.currentPlayer === this.playerDeck ? this.botDeck : this.playerDeck;
        
        // Start new turn
        setTimeout(() => {
            this.currentPlayer.startTurn();
        }, 500);
    }
} 