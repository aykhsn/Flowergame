import Phaser from 'phaser';

class BalloonGame extends Phaser.Scene {
    private balloons: Phaser.GameObjects.Image[];
    private balloonScale: number;
    private clickSound!: Phaser.Sound.BaseSound;
    private balloonColors: string[];
    private lastPoppedColor: string | null; // 最後に割れた風船の色を保持

    constructor() {
        super({ key: 'balloonGame' });
        this.balloons = [];
        this.balloonScale = 0.5; // 風船のスケールを少し大きくする
        this.balloonColors = ['yellow', 'red', 'blue', 'green']; // 風船の色の配列
        this.lastPoppedColor = null;
    }

    preload() {
        this.balloonColors.forEach(color => {
            this.load.image(`${color}Balloon`, `dist/assets/${color}.png`);
        });
        this.load.audio('clickSound', 'dist/assets/pui.mp3');
    }

    create() {
        const gameWidth = this.cameras.main.width;
        const gameHeight = this.cameras.main.height;
        const balloonCount = 5;
        const balloonPadding = 40; // 風船同士の間隔
        const upperHeight = gameHeight * (2 / 3); // 画面の上部3分の2の高さ
        const sidePadding = 100; // 画面端からの最小距離

        this.cameras.main.setBackgroundColor('#D0F0F0'); // 水色に設定

        this.clickSound = this.sound.add('clickSound'); // クリック音の設定

        this.spawnBalloons(balloonCount, balloonPadding, gameWidth, upperHeight, sidePadding);
    }

    spawnBalloons(count: number, padding: number, width: number, height: number, sidePadding: number) {
      for (let i = 0; i < count; i++) {
          // 色をランダムに選択する
          const colorIndex = Phaser.Math.Between(0, this.balloonColors.length - 1);
          const color = this.balloonColors[colorIndex];
  
          let randomX = Phaser.Math.Between(sidePadding, width - sidePadding);
          let randomY = Phaser.Math.Between(padding, height);
  
          const balloon = this.add.image(randomX, randomY, `${color}Balloon`).setScale(this.balloonScale);
          balloon.setInteractive();
          balloon.on('pointerdown', () => {
              this.handleBalloonPop(balloon);
          });
  
          this.balloons.push(balloon);
  
          // 風船が重ならないように配置するための処理
          this.adjustBalloonOverlap(balloon, i, count, sidePadding, width, height, padding);
  
          // 風船をぷかぷかさせるTweenを設定
          this.tweens.add({
              targets: balloon,
              y: balloon.y + 10,
              duration: 1500,
              ease: 'Sine.easeInOut',
              yoyo: true,
              repeat: -1,
              delay: i * 100 // 各風船ごとに少し遅らせて開始する
          });
      }
  }

    adjustBalloonOverlap(balloon: Phaser.GameObjects.Image, index: number, count: number, sidePadding: number, width: number, height: number, padding: number) {
        const balloonRect = balloon.getBounds();
        let overlap = false;

        do {
            overlap = false;
            for (let j = 0; j < this.balloons.length; j++) {
                if (j !== index && Phaser.Geom.Intersects.RectangleToRectangle(balloonRect, this.balloons[j].getBounds())) {
                    overlap = true;
                    balloon.x = Phaser.Math.Between(sidePadding, width - sidePadding);
                    balloon.y = Phaser.Math.Between(padding, height);
                    balloonRect.setTo(balloon.x, balloon.y, balloonRect.width, balloonRect.height);
                    break;
                }
            }
        } while (overlap);
    }

    handleBalloonPop(balloon: Phaser.GameObjects.Image) {
        this.clickSound.play(); // クリック音を再生

        this.tweens.add({
            targets: balloon,
            y: this.cameras.main.height - balloon.displayHeight / 2, // 画面の下部に落下してとどまる
            duration: 1000,
            ease: 'Power1',
            onComplete: () => {
                balloon.destroy(); // 風船を破壊して消す
                this.balloons = this.balloons.filter(b => b !== balloon);

                // 最後に割れた風船の色を保持
                const poppedColor = balloon.texture.key.replace('Balloon', '');
                this.lastPoppedColor = poppedColor;

                // すべての風船が落下したら新たに生成する
                if (this.balloons.length === 0) {
                    this.time.delayedCall(500, () => {
                        this.spawnNewBalloons(7, 20, this.cameras.main.width, this.cameras.main.height, 100, this.lastPoppedColor);
                    });
                }
            }
        });
    }

    spawnNewBalloons(count: number, padding: number, width: number, height: number, sidePaddingOverride: number, colorToMatch: string | null = null) {
      // 一斉に新しい風船を生成する処理
      const balloonCount = count;
      const balloonPadding = padding;
      const upperHeight = height * (2 / 3); // 画面の上部3分の2の高さ
  
      const newBalloons: Phaser.GameObjects.Image[] = [];
  
      for (let i = 0; i < balloonCount; i++) {
          // 色をランダムに選択する
          const colorIndex = Phaser.Math.Between(0, this.balloonColors.length - 1);
          const color = this.balloonColors[colorIndex];
  
          let randomX = Phaser.Math.Between(sidePaddingOverride, width - sidePaddingOverride);
          let randomY = Phaser.Math.Between(balloonPadding, upperHeight);
  
          const balloon = this.add.image(randomX, randomY, `${color}Balloon`).setScale(this.balloonScale);
          balloon.setInteractive();
          balloon.on('pointerdown', () => {
              this.handleBalloonPop(balloon);
          });
  
          newBalloons.push(balloon);
  
          // 風船が重ならないように配置するための処理
          this.adjustBalloonOverlap(balloon, i, balloonCount, sidePaddingOverride, width, height, balloonPadding);
  
          // 風船をぷかぷかさせるTweenを設定
          this.tweens.add({
              targets: balloon,
              y: balloon.y + 10,
              duration: 1500,
              ease: 'Sine.easeInOut',
              yoyo: true,
              repeat: -1,
              delay: i * 100 // 各風船ごとに少し遅らせて開始する
          });
      }
  
      // 新しい風船を追加する前に、古い風船を削除する
      this.balloons.forEach(balloon => {
          balloon.destroy();
      });
  
      this.balloons = newBalloons;
  }
}

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: '100%',
    height: '100%',
    scene: BalloonGame,
    parent: 'game',
    backgroundColor: '#D0F0F0', // 背景色を淡い水色に設定
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

new Phaser.Game(config);
