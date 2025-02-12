import { Application, Graphics, Text, Container } from './pixi.min.mjs';
import { DeckManager } from './src/cards/DeckManager.js';
import { GameManager } from './src/game/GameManager.js';

(async() => {
  // Initialize the application
  const app = new Application();
  await app.init({
    resizeTo: window,
    background: '#1a1a1a', // Dark background for magical atmosphere
  });
  app.canvas.style.position = 'absolute';
  document.body.appendChild(app.canvas);

  // Create play areas for both players
  function createPlayerArea(isBot = false) {
    const playerArea = new Container();
    const areaHeight = 250; // Height of each player's total area
    
    // Position the area at bottom for player, at top for bot
    playerArea.y = isBot ? 0 : app.screen.height - areaHeight;

    // Create and style different zones
    const zoneStyle = {
      fill: 0x2a2a2a,
      stroke: { width: 2, color: 0x444444 }
    };

    // Create deck manager for this player
    const deckManager = new DeckManager(isBot);
    
    // Position deck
    deckManager.deckContainer.x = 50;
    deckManager.deckContainer.y = (areaHeight - 160) / 2;
    
    // Position hand area
    deckManager.handContainer.x = 200;
    deckManager.handContainer.y = (areaHeight - 160) / 2;

    // Position play area
    deckManager.playAreaContainer.x = 200;
    deckManager.playAreaContainer.y = isBot ? areaHeight + 20 : -220;

    // Hand Area background
    const handArea = new Graphics()
      .rect(0, 0, app.screen.width - 400, 160)
      .fill(zoneStyle.fill)
      .stroke(zoneStyle.stroke);
    handArea.x = 200;
    handArea.y = (areaHeight - 160) / 2;

    // Playing Area background
    const playArea = new Graphics()
      .rect(0, 0, app.screen.width - 400, 200)
      .fill({ color: 0x233343 })
      .stroke({ width: 2, color: 0x445566 });
    playArea.x = 200;
    playArea.y = isBot ? areaHeight + 20 : -220;

    // Discard Pile (right side)
    const discardPile = new Graphics()
      .rect(0, 0, 120, 160)
      .fill({ color: 0x3a1f0f, alpha: 0.5 })
      .stroke({ width: 2, color: 0x8b7355 });
    discardPile.x = app.screen.width - 170;
    discardPile.y = (areaHeight - 160) / 2;

    // Add zone labels
    function createLabel(text, x, y) {
      const label = new Text({
        text,
        style: { fill: 0xcccccc, fontSize: 16 }
      });
      label.x = x;
      label.y = y;
      return label;
    }

    playerArea.addChild(handArea);
    playerArea.addChild(deckManager.deckContainer);
    playerArea.addChild(deckManager.handContainer);
    playerArea.addChild(playArea);
    playerArea.addChild(deckManager.playAreaContainer);
    playerArea.addChild(discardPile);
    playerArea.addChild(createLabel("Draw Deck", 60, 20));
    playerArea.addChild(createLabel("Hand", app.screen.width / 2 - 30, 20));
    playerArea.addChild(createLabel("Discard", app.screen.width - 160, 20));

    return {
      container: playerArea,
      deckManager
    };
  }

  // Create both player areas
  const player = createPlayerArea(false);
  const bot = createPlayerArea(true);

  // Add areas to stage
  app.stage.addChild(bot.container);
  app.stage.addChild(player.container);

  // Draw initial hands (7 cards each)
  for (let i = 0; i < 7; i++) {
    player.deckManager.drawCard();
    bot.deckManager.drawCard();
  }

  // Initialize game manager
  const gameManager = new GameManager(player.deckManager, bot.deckManager);

  // Add turn indicator
  const turnIndicator = new Text({
    text: "Your Turn",
    style: { 
      fill: 0xffffff,
      fontSize: 24,
      fontWeight: 'bold'
    }
  });
  turnIndicator.x = app.screen.width / 2 - 50;
  turnIndicator.y = app.screen.height / 2 - 15;
  app.stage.addChild(turnIndicator);

  // Update turn indicator when turns switch
  player.deckManager.onTurnEnd = () => {
    turnIndicator.text = "Bot's Turn";
    gameManager.switchTurn();
  };
  
  bot.deckManager.onTurnEnd = () => {
    turnIndicator.text = "Your Turn";
    gameManager.switchTurn();
  };
})();
