import { Graphics, Container } from '../../pixi.min.mjs';

export class MagicEffects {
    static createSparkle() {
        const sparkle = new Graphics();
        sparkle.beginFill(0xffd700, 0.8);
        sparkle.drawStar(0, 0, 4, 2, 4);
        sparkle.endFill();
        return sparkle;
    }

    static async animateCardMovement(card, startX, startY, endX, endY, parent, duration = 500) {
        // Create sparkles container
        const sparkles = new Container();
        parent.addChild(sparkles);

        // Create sparkles
        for (let i = 0; i < 10; i++) {
            const sparkle = this.createSparkle();
            sparkle.x = startX;
            sparkle.y = startY;
            sparkle.alpha = 0;
            sparkles.addChild(sparkle);
        }

        const startTime = Date.now();

        return new Promise(resolve => {
            const animate = () => {
                const now = Date.now();
                const elapsed = now - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Move card in an arc
                const arcHeight = 50;
                card.x = startX + (endX - startX) * progress;
                card.y = startY + (endY - startY) * progress 
                    - Math.sin(progress * Math.PI) * arcHeight;

                // Animate sparkles
                sparkles.children.forEach((sparkle, index) => {
                    const sparkleProgress = (progress + index * 0.1) % 1;
                    sparkle.x = startX + (endX - startX) * sparkleProgress;
                    sparkle.y = startY + (endY - startY) * sparkleProgress 
                        - Math.sin(sparkleProgress * Math.PI) * (arcHeight + Math.random() * 20);
                    sparkle.alpha = Math.sin(sparkleProgress * Math.PI);
                    sparkle.rotation += 0.1;
                });

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    parent.removeChild(sparkles);
                    resolve();
                }
            };

            animate();
        });
    }
} 