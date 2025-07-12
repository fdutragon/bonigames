import * as Phaser from "phaser";
import { useGameStore, gameSync } from "../lib/gameStore";

// Mapa baseado na imagem fornecida
interface MapZone {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: number;
  objects?: { x: number; y: number; type: string }[];
}

interface VillagerData {
  x: number;
  y: number;
  found: boolean;
  zone: string;
}



export class MainScene extends Phaser.Scene {
  player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  otherPlayers!: Phaser.GameObjects.Group;
  cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  villagerSprites: Phaser.Physics.Arcade.Sprite[] = [];
  villagers: VillagerData[] = [];
  villagersFound = 0;
  totalVillagers = 12;
  gameText!: Phaser.GameObjects.Text;
  isMobile = false;
  mapZones: MapZone[] = [];
  lastPositionUpdate = 0;

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
    
    // Configurar tamanho do mundo
    const worldWidth = 1600;
    const worldHeight = 1200;
    
    // Criar mapa baseado na imagem
    this.createMapZones();
    this.renderMap();
    
    // Configurar grupo de outros jogadores
    this.otherPlayers = this.add.group();
    
    // Player no centro do mapa
    this.player = this.physics.add.sprite(worldWidth / 2, worldHeight / 2, "player");
    this.player.setCollideWorldBounds(true);
    this.player.setTint(0x00ff00); // Verde para distinguir do próprio jogador
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
    
    // Configurar villagers baseados nas zonas
    this.createVillagers();
    
    // UI Text
    this.gameText = this.add.text(16, 16, `Moradores encontrados: ${this.villagersFound}/${this.totalVillagers}`, {
      fontSize: '20px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 }
    });
    this.gameText.setScrollFactor(0);
    
    // Instruções
    const instructions = this.add.text(16, 60, 'Explore e encontre os moradores!\nJogadores online aparecerão em tempo real.', {
      fontSize: '14px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 }
    });
    instructions.setScrollFactor(0);
    
    this.cursors = this.input.keyboard ? this.input.keyboard.createCursorKeys() : undefined;
    
    // Conectar ao sistema multiplayer
    this.connectToMultiplayer();
    
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
    const joystick = (window as unknown as { phaserScene?: { joystickInput?: { x: number; y: number } } }).phaserScene?.joystickInput;
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
    // Sincronizar posição com outros jogadores (throttle)
    const now = Date.now();
    if (now - this.lastPositionUpdate > 100) {
      gameSync.updateMyPosition(this.player.x, this.player.y);
      this.lastPositionUpdate = now;
    }
    this.updateOtherPlayers();
    this.updateVillagerVisibility();
    this.gameText.setText(`Moradores encontrados: ${this.villagersFound}/${this.totalVillagers}`);
    if (this.villagersFound === this.totalVillagers) {
      this.gameText.setText(`Parabéns! Você encontrou todos os ${this.totalVillagers} moradores!`);
    }
  }

  private createMapZones() {
    // Mapa baseado na imagem fornecida
    this.mapZones = [
      {
        name: "Floresta",
        x: 200,
        y: 100,
        width: 1000,
        height: 600,
        color: 0x228B22,
        objects: [
          { x: 400, y: 250, type: "tree" },
          { x: 600, y: 300, type: "tree" },
          { x: 800, y: 200, type: "tree" }
        ]
      },
      {
        name: "Cidade dos Príncipes",
        x: 50,
        y: 350,
        width: 200,
        height: 200,
        color: 0x8B4513,
        objects: [
          { x: 100, y: 400, type: "house" },
          { x: 150, y: 450, type: "house" },
          { x: 120, y: 500, type: "house" }
        ]
      },
      {
        name: "Fazenda",
        x: 400,
        y: 700,
        width: 300,
        height: 200,
        color: 0xDEB887,
        objects: [
          { x: 450, y: 750, type: "house" },
          { x: 550, y: 800, type: "house" }
        ]
      },
      {
        name: "Porto de Barcos",
        x: 1200,
        y: 50,
        width: 300,
        height: 150,
        color: 0x4682B4,
        objects: [
          { x: 1250, y: 100, type: "house" }
        ]
      },
      {
        name: "Pier do Lago",
        x: 1100,
        y: 600,
        width: 400,
        height: 300,
        color: 0x87CEEB,
        objects: []
      }
    ];
  }

  private renderMap() {
    // Fundo azul (oceano)
    this.add.rectangle(800, 600, 1600, 1200, 0x4169E1);
    
    // Renderizar zonas
    for (const zone of this.mapZones) {
      // Zona base
      this.add.rectangle(zone.x + zone.width/2, zone.y + zone.height/2, zone.width, zone.height, zone.color);
      
      // Objetos da zona
      if (zone.objects) {
        for (const obj of zone.objects) {
          this.add.image(obj.x, obj.y, obj.type).setOrigin(0.5, 1);
        }
      }
      
      // Label da zona
      this.add.text(zone.x + 10, zone.y + 10, zone.name, {
        fontSize: '16px',
        color: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 5, y: 3 }
      });
    }
  }

  private createVillagers() {
    // Distribuir villagers pelas zonas
    const villagerPositions = [
      // Floresta
      { x: 350, y: 280, zone: "Floresta" },
      { x: 550, y: 320, zone: "Floresta" },
      { x: 750, y: 230, zone: "Floresta" },
      { x: 900, y: 400, zone: "Floresta" },
      // Cidade dos Príncipes  
      { x: 80, y: 420, zone: "Cidade dos Príncipes" },
      { x: 180, y: 480, zone: "Cidade dos Príncipes" },
      { x: 140, y: 530, zone: "Cidade dos Príncipes" },
      // Fazenda
      { x: 480, y: 780, zone: "Fazenda" },
      { x: 580, y: 830, zone: "Fazenda" },
      // Porto de Barcos
      { x: 1280, y: 130, zone: "Porto de Barcos" },
      // Pier do Lago
      { x: 1200, y: 750, zone: "Pier do Lago" },
      { x: 1350, y: 800, zone: "Pier do Lago" }
    ];

    this.villagers = villagerPositions.map(pos => ({
      x: pos.x,
      y: pos.y,
      found: false,
      zone: pos.zone
    }));

    // Criar sprites dos villagers
    this.villagers.forEach((v) => {
      const villager = this.physics.add.sprite(v.x, v.y, "villager");
      villager.setVisible(false);
      villager.setTint(0xff6666);
      villager.alpha = 0;
      this.villagerSprites.push(villager);
      
      this.physics.add.overlap(this.player, villager, () => {
        if (!v.found && villager.visible && villager.alpha > 0.8) {
          v.found = true;
          villager.setVisible(false);
          this.villagersFound++;
          
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
        }
      });
    });
  }

  private async connectToMultiplayer() {
    try {
      const roomCode = "boni_game_room"; // Sala padrão
      const playerName = `Player_${Math.random().toString(36).substr(2, 5)}`;
      await gameSync.joinRoom(roomCode, playerName);
    } catch (error) {
      console.warn("Falha ao conectar ao multiplayer:", error);
    }
  }

  private updateOtherPlayers() {
    const gameState = useGameStore.getState();
    const players = gameState.players;
    // Limpar jogadores que saíram
    this.otherPlayers.children.entries.forEach((child) => {
      const sprite = child as Phaser.GameObjects.Sprite & { playerId?: string; nameText?: Phaser.GameObjects.Text };
      if (typeof sprite.playerId === 'string' && !players.has(sprite.playerId)) {
        sprite.destroy();
        if (sprite.nameText) sprite.nameText.destroy();
      }
    });
    // Atualizar/criar jogadores ativos
    players.forEach((player, id) => {
      if (id === gameState.myPlayerId) return;
      let playerSprite = this.otherPlayers.children.entries.find((child) => {
        return (child as Phaser.GameObjects.Sprite & { playerId?: string }).playerId === id;
      }) as (Phaser.GameObjects.Sprite & { playerId?: string; nameText?: Phaser.GameObjects.Text }) | undefined;
      if (!playerSprite) {
        playerSprite = this.add.sprite(player.x, player.y, "player") as Phaser.GameObjects.Sprite & { playerId?: string; nameText?: Phaser.GameObjects.Text };
        playerSprite.setTint(parseInt(player.color.replace('#', '0x')));
        playerSprite.playerId = id;
        this.otherPlayers.add(playerSprite);
        const nameText = this.add.text(player.x, player.y - 40, player.name, {
          fontSize: '12px',
          color: '#ffffff',
          backgroundColor: '#000000',
          padding: { x: 3, y: 2 }
        });
        nameText.setOrigin(0.5);
        playerSprite.nameText = nameText;
      } else {
        this.tweens.add({
          targets: playerSprite,
          x: player.x,
          y: player.y,
          duration: 100,
          ease: 'Linear'
        });
        if (playerSprite.nameText) {
          this.tweens.add({
            targets: playerSprite.nameText,
            x: player.x,
            y: player.y - 40,
            duration: 100,
            ease: 'Linear'
          });
        }
      }
    });
  }

  private updateVillagerVisibility() {
    this.villagers.forEach((villager, index) => {
      const dx = villager.x - this.player.x;
      const dy = villager.y - this.player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const shouldBeVisible = dist < 120 && !villager.found;
      const sprite = this.villagerSprites[index];
      
      if (shouldBeVisible) {
        sprite.setVisible(true);
        if (sprite.alpha < 1) sprite.alpha = Math.min(sprite.alpha + 0.02, 1);
      } else if (!villager.found) {
        if (sprite.alpha > 0) sprite.alpha = Math.max(sprite.alpha - 0.05, 0);
        if (sprite.alpha === 0) sprite.setVisible(false);
      }
    });
  }
}
