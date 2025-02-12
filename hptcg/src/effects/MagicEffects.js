import { Graphics, Container } from '../../pixi.min.mjs';

export class MagicEffects {
    static createSpark() {
        const spark = new Graphics();
        spark.beginFill(0xffeb3b, 0.8);
        spark.drawStar(0, 0, 5, 2, 4);
        spark.endFill();
        return spark;
    }

    static async createMagicSparkles(container, startX, startY, endX, endY) {
        const sparkles = new Container();
        container.addChild(sparkles);

        // Create multiple sparks
        for (let i = 0; i < 15; i++) {
            const spark = this.createSpark();
            spark.x = startX;
            spark.y = startY;
            sparkles.addChild(spark);

            // Random spark animation
            const duration = 500 + Math.random() * 500;
            const delay = Math.random() * 300;
            const sparkEndX = endX + (Math.random() - 0.5) * 100;
            const sparkEndY = endY + (Math.random() - 0.5) * 100;

            setTimeout(() => {
                // Animate each spark
                const animate = () => {
                    const progress = (Date.now() - startTime) / duration;
                    if (progress >= 1) {
                        spark.alpha = 0;
                        if (sparkles.children.every(s => s.alpha === 0)) {
                            container.removeChild(sparkles);
                        }
                        return;
                    }

                    // Curved path animation
                    const curveHeight = 100;
                    const cx = startX + (sparkEndX - startX) * progress;
                    const cy = startY + (sparkEndY - startY) * progress 
                        - Math.sin(progress * Math.PI) * curveHeight;

                    spark.x = cx;
                    spark.y = cy;
                    spark.rotation += 0.1;
                    spark.alpha = Math.sin(progress * Math.PI);
                    spark.scale.set(Math.sin(progress * Math.PI));

                    requestAnimationFrame(animate);
                };

                const startTime = Date.now();
                animate();
            }, delay);
        }
    }
} 