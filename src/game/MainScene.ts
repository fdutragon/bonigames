import Phaser from "phaser";
import { generateDynamicWorld, type DynamicWorld, type WorldObject, findSafeSpawnPoints } from "./maps/dynamicWorld";

interface VillagerData {
  x: number;
  y: number;
  found: boolean;
  hideSpot: WorldObject;
}

export class MainScene extends Phaser.Scene {
  player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  world!: DynamicWorld;
  worldObjects: Phaser.GameObjects.Sprite[] = [];
  villagerSprites: Phaser.Physics.Arcade.Sprite[] = [];
  villagers: VillagerData[] = [];
  villagersFound = 0;
  totalVillagers = 12;
  gameText!: Phaser.GameObjects.Text;
  isMobile = false;
  hidingSpots: WorldObject[] = [];

  preload() {
    // Sprites 2.5D com diferentes variações e tamanhos
    this.load.image("player", "/assets/player.svg");
    
    // Árvores com variações
    this.load.image("tree_1", "/assets/tree.svg");
    this.load.image("tree_2", "/assets/tree.svg");
    this.load.image("tree_3", "/assets/tree.svg");
    
    // Casas com variações
    this.load.image("house_1", "/assets/house.svg");
    this.load.image("house_2", "/assets/house.svg");
    this.load.image("house_3", "/assets/house.svg");
    this.load.image("house_4", "/assets/house.svg");
    
    // Elementos decorativos
    this.load.image("bush_1", "/assets/bush.svg");
    this.load.image("bush_2", "/assets/bush.svg");
    this.load.image("rock_1", "/assets/rock.svg");
    this.load.image("rock_2", "/assets/rock.svg");
    this.load.image("rock_3", "/assets/rock.svg");
    this.load.image("flower", "/assets/grass.svg");
    this.load.image("lamp", "/assets/grass.svg");
    this.load.image("well", "/assets/grass.svg");
    this.load.image("fence", "/assets/grass.svg");
    
    // Moradores
    this.load.image("villager", "/assets/villager.svg");
    
    // Terreno base
    this.load.image("grass", "/assets/grass.svg");
    this.load.image("dirt", "/assets/dirt.svg");
  }

  create() {
    // Detectar mobile
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Gerar mapa baseado no tamanho da tela
    const screenWidth = this.cameras.main.width;
    const screenHeight = this.cameras.main.height;
    
    // Criar mapa menor para mobile, maior para desktop
    const mapSize = this.isMobile ? 
      Math.min(screenWidth * 2, screenHeight * 2, 1280) : 
      Math.min(screenWidth * 1.5, screenHeight * 1.5, 1600);
    
    this.mapData = generateProceduralMap(mapSize, mapSize);
    this.houses = spawnHouses(15, this.mapData.width, this.mapData.height);
    this.villagers = spawnVillagers(this.totalVillagers, this.mapData.hidingSpots);
    
    // Renderiza tiles do mapa
    this.mapData.tiles.forEach((tile: Tile) => {
      const tileSprite = this.add.image(tile.x, tile.y, tile.type).setOrigin(0);
      // Destacar esconderijos com uma leve transparência
      if (tile.isHidingSpot) {
        tileSprite.setTint(0x88ff88);
      }
    });
    
    // Player no centro do mapa
    this.player = this.physics.add.sprite(this.mapData.width / 2, this.mapData.height / 2, "player");
    this.player.setCollideWorldBounds(true);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, this.mapData.width, this.mapData.height);
    
    // Casas
    this.houses.forEach((h: House) => {
      this.add.image(h.x, h.y, "house").setOrigin(0.5, 1);
    });
    
    // Moradores (inicialmente invisíveis)
    this.villagers.forEach((v: Villager) => {
          const villager = this.physics.add.sprite(v.x, v.y, "villager");
          villager.setVisible(false); // Inicialmente invisível
          villager.setTint(0xff6666); // Cor diferente para destacar
          villager.alpha = 0;
          this.villagerSprites.push(villager);
          this.physics.add.overlap(this.player, villager, () => {
            if (!v.found && villager.visible && villager.alpha > 0.8) {
              v.found = true;
              villager.setVisible(false);
              this.villagersFound++;
              // HUD/Evento
              window.dispatchEvent(new CustomEvent('villagerFound', {
                detail: {
                  found: this.villagersFound,
                  total: this.totalVillagers
                }
              }));
              // Efeito visual
              const foundText = this.add.text(v.x, v.y - 30, 'Encontrado!', {
                fontSize: '20px',
                color: '#00ff00',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 2
              });
              this.tweens.add({
                targets: foundText,
                y: v.y - 80,
                alpha: 0,
                scale: 1.5,
                duration: 1500,
                ease: 'Power2',
                onComplete: () => foundText.destroy()
              });
              // this.sound.play('found');
            }
          });
    });
    
    // UI Text
    this.gameText = this.add.text(16, 16, `Moradores encontrados: ${this.villagersFound}/${this.totalVillagers}`, {
      fontSize: '20px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 }
    });
    this.gameText.setScrollFactor(0); // Fixar na tela
    
    // Instruções
    const instructions = this.add.text(16, 60, 'Explore e encontre os moradores escondidos!\nChegue perto dos esconderijos para revelá-los.', {
      fontSize: '14px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 }
    });
    instructions.setScrollFactor(0);
    
    this.cursors = this.input.keyboard ? this.input.keyboard.createCursorKeys() : undefined;
    // Expor referência global para integração joystick
    (window as any).phaserScene = this;
    
    // Corrige AudioContext fechado
    if (
      this.sound &&
      this.sound instanceof Phaser.Sound.WebAudioSoundManager &&
      this.sound.context &&
      this.sound.context.state === "closed"
    ) {
      this.sound.context.resume();
    }
  }

  update() {
    // Controle do jogador
    const joystick = (window as any).phaserScene?.joystickInput;
    const speed = 200;
    
    if (joystick && (joystick.x !== 0 || joystick.y !== 0)) {
      this.player.setVelocityX(joystick.x * speed);
      this.player.setVelocityY(joystick.y * speed);
    } else if (this.cursors) {
      this.player.setVelocity(0);
      if (this.cursors.left?.isDown) this.player.setVelocityX(-speed);
      if (this.cursors.right?.isDown) this.player.setVelocityX(speed);
      if (this.cursors.up?.isDown) this.player.setVelocityY(-speed);
      if (this.cursors.down?.isDown) this.player.setVelocityY(speed);
    }
    
    // Atualizar visibilidade dos moradores
    this.villagers.forEach((villager, index) => {
      const shouldBeVisible = updateVillagerVisibility(villager, this.player.x, this.player.y);
      const sprite = this.villagerSprites[index];
      
      if (shouldBeVisible && !villager.found) {
        sprite.setVisible(true);
        // Efeito de "aparecer" gradualmente
        if (sprite.alpha < 1) {
          sprite.alpha = Math.min(sprite.alpha + 0.02, 1);
        }
      } else if (!villager.found) {
        // Efeito de "desaparecer" gradualmente
        if (sprite.alpha > 0) {
          sprite.alpha = Math.max(sprite.alpha - 0.05, 0);
        }
        if (sprite.alpha === 0) {
          sprite.setVisible(false);
        }
      }
    });
    
    // Atualizar UI
    this.gameText.setText(`Moradores encontrados: ${this.villagersFound}/${this.totalVillagers}`);
    
    // Verificar vitória
    if (this.villagersFound === this.totalVillagers) {
      this.gameText.setText(`Parabéns! Você encontrou todos os ${this.totalVillagers} moradores!`);
    }
  }
}
