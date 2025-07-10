import pygame, math, random, time

pygame.init()

# 1. Configurações e Cores (C = Config)
CW, CH = 1100, 1000 # Screen Width, Screen Height (Janela do jogo)
s = pygame.display.set_mode((CW, CH))
pygame.display.set_caption("BR na Ilha (Tempestade Ajustada)")

# Definindo cores
C_B, C_G, C_W, C_R, C_Y, C_BR, C_GR, C_LB, C_DG = (0,0,255),(0,255,0),(255,255,255),(255,0,0),(255,255,0),(139,69,19),(100,100,100),(173,216,230),(50,50,50)
C_HBG, C_HBR, C_O, C_HL, C_BL = (0,200,0),(200,0,0),(255,165,0),(0,255,255),(0,0,0) # C_BL é usado para o "escuro" fora do FOV

SC = (0,150,0) # Shoot Color
F_L, F_M, F_S, F_T = pygame.font.Font(None, 74), pygame.font.Font(None, 36), pygame.font.Font(None, 24), pygame.font.Font(None, 18)

# Botão de Atirar - Maior e fixo no canto inferior direito
SR = pygame.Rect(CW - 250, CH - 120, 230, 100) # Shoot Rect (Aumentado)

# Estados
GS_P, GS_W, GS_L = 0,1,2 # Gameplay, Win, Lose
gs = GS_P # Game State

# Ilha
IR = min(CW, CH) / 2 - 50 # Raio da ilha
ICX, ICY = CW // 2, CH // 2 # Centro da ilha, no meio da janela

# Cenário (L = Landmark)
L = [
    {"t":"h", "x":ICX-40, "y":ICY-IR+70, "w":80, "h":60, "wc":C_B, "rc":C_BR, "n":"Casa Solitária"},
    {"t":"l", "x":ICX-IR+80, "y":ICY-60, "w":120, "h":120, "c":C_LB, "n":"O Lago"},
    {"t":"m", "x":ICX+IR-260, "y":ICY-60, "w":180, "h":120, "wc":C_DG, "rc":C_BR, "n":"A Mansão"}
]
VW, VH, VS = 50, 40, 8 # Village Width, Height, Spacing
VBX, VBY = ICX - (VW * 1.5 + VS * 0.5), ICY + IR - 150
VHC = [(VBX, VBY), (VBX+VW+VS, VBY), (VBX, VBY+VH+VS), (VBX+VW+VS, VBY+VH+VS)]
L.append({"t":"v", "c":VHC, "w":VW, "h":VH, "wc":C_GR, "rc":C_BR, "n":"Vila Quadrada"})

# Câmera / Campo de Visão
OX, OY = 0,0 # Offset X, Offset Y (sempre 0 com o mundo sendo a tela)
PVR = 300 # Player View Range (Campo de Visão do Jogador)

# Zona de Dano (Area Preta que Diminui)
DZ_Max_Radius = math.hypot(CW/2, CH/2) + 50 # Um pouco maior que a diagonal da tela para cobrir os cantos
DZ_Total_Shrink_Time = 3 * 60 # TEMPO AUMENTADO: 3 minutos em segundos (antes 2 minutos)
DZ_Shrink_Rate_Factor = 0.8 # FATOR DE VELOCIDADE REDUZIDO: Torna a tempestade um pouco mais lenta
DZ_Shrink_Rate = ((DZ_Max_Radius - 0) / DZ_Total_Shrink_Time) * DZ_Shrink_Rate_Factor
DZ_Current_Radius = DZ_Max_Radius # Começa com o raio máximo
DZ_Damage = 1 # Dano por segundo
DZ_Transparency = 150 # Transparência da tempestade (0-255, 255 é opaco)

HPSI = 10000 # Health Pickup Spawn Interval

# Configurações de Tiro e Munição
BULLET_SPEED = 5 # Velocidade da bala

# Novos assets visuais
C_CLOUD = (240,240,255)
C_MOUNTAIN = (120,110,100)
C_PACWALL = (255, 255, 0)
C_OBS = (80, 80, 80)

# Watch Dogs - Cores e Elementos
C_HACK = (0, 255, 100)  # Verde neon para hacking
C_CAMERA = (255, 50, 50)  # Vermelho para câmeras
C_SIGNAL = (100, 150, 255)  # Azul para sinais
C_ELECTRIC = (255, 255, 100)  # Amarelo elétrico
C_CYBER = (150, 0, 255)  # Roxo cyber

# Obstáculos e paredes tipo Pacman
PAC_WALLS = [pygame.Rect(400, 400, 80, 200), pygame.Rect(700, 200, 80, 300)]
OBSTACLES = [pygame.Rect(200, 600, 60, 60), pygame.Rect(900, 800, 50, 100), pygame.Rect(600, 700, 100, 40)]

# Casas Pacman
PAC_HOUSES = [pygame.Rect(150, 150, 120, 120), pygame.Rect(850, 700, 120, 120)]

# Nuvens
CLOUDS = [(100,80,120,60), (600,100,180,80), (900,60,140,70), (400,200,100,50)]

# Montanhas
MOUNTAINS = [(300,900,120,80), (800,950,200,100), (600,850,100,60)]

# Watch Dogs - Sistema de Hacking
CAMERAS = [
    {"x": 200, "y": 200, "range": 150, "active": True, "angle": 0, "sweep": True},
    {"x": 600, "y": 400, "range": 120, "active": True, "angle": 90, "sweep": False},
    {"x": 900, "y": 700, "range": 180, "active": True, "angle": 180, "sweep": True},
    {"x": 400, "y": 800, "range": 140, "active": True, "angle": 270, "sweep": False}
]

HACK_TARGETS = [
    {"x": 300, "y": 300, "type": "power", "hacked": False, "cooldown": 0},
    {"x": 700, "y": 500, "type": "signal", "hacked": False, "cooldown": 0},
    {"x": 500, "y": 200, "type": "trap", "hacked": False, "cooldown": 0},
    {"x": 800, "y": 800, "type": "shield", "hacked": False, "cooldown": 0}
]

HACKING_RANGE = 100
HACK_COOLDOWN = 5000  # 5 segundos em millisegundos

# Formas e cores para jogadores
PLAYER_SHAPES = [
    [(-0.5, -0.5), (1, 0), (-0.5, 0.5)],  # Triangulo
    [(-0.7, -0.4), (0.7, -0.4), (0.7, 0.4), (-0.7, 0.4)],  # Retangulo
    [(-0.6, -0.3), (0.6, -0.3), (0.4, 0.3), (-0.4, 0.3)]   # Trapézio
]

PLAYER_COLORS = [
    (255, 100, 100),  # Vermelho claro
    (100, 255, 100),  # Verde claro
    (100, 100, 255),  # Azul claro
    (255, 255, 100),  # Amarelo
    (255, 100, 255),  # Magenta
    (100, 255, 255),  # Ciano
]

# 2. Funções Auxiliares (F = Function)
def F_RP(mdfe=30): # Random Position
    while True:
        x,y = random.uniform(ICX-IR, ICX+IR), random.uniform(ICY-IR, ICY+IR)
        if math.hypot(x-ICX, y-ICY) < IR-mdfe: return x,y

def F_WS(wx,wy,ox,oy): return wx-ox,wy-oy # World to Screen

def F_DE(surf,el,ox,oy): el.draw(surf,ox,oy) # Draw Element
def F_DL(surf,ld,ox,oy): # Draw Landmark
    if ld["t"] in ("h","m"): F_DH(surf,ld["x"],ld["y"],ld["w"],ld["h"],ld["wc"],ld["rc"],ox,oy)
    elif ld["t"]=="l": pygame.draw.ellipse(surf,ld["c"],(*F_WS(ld["x"],ld["y"],ox,oy),ld["w"],ld["h"]))
    elif ld["t"]=="v":
        for pos in ld["c"]: F_DH(surf,pos[0],pos[1],ld["w"],ld["h"],ld["wc"],ld["rc"],ox,oy)

def F_DH(surf,x,y,w,h,wc,rc,ox=0,oy=0): # Draw House
    sx,sy = F_WS(x,y,ox,oy); pygame.draw.rect(surf,wc,(sx,sy,w,h))
    pygame.draw.polygon(surf,rc,[(sx,sy),(sx+w,sy),(sx+w//2,sy-h//2)])

def F_DLN(surf,ld,ox,oy): # Draw Landmark Name
    if "n" in ld:
        tx,ty = 0,0
        if ld["t"] in ("h","l","m"): tx,ty = ld["x"]+ld["w"]//2,ld["y"]-20
        elif ld["t"]=="v": tx,ty = ld["c"][0][0]+ld["w"],ld["c"][0][1]-20
        ts = F_S.render(ld["n"],True,C_W)
        tr = ts.get_rect(center=F_WS(tx,ty,ox,oy))
        if 0 < tr.centerx < CW and 0 < tr.centery < CH: surf.blit(ts,tr)

# 3. Classes (C = Class)
class A: # Arrow (Player/Bot)
    def __init__(self,x,y,c,is_p=False):
        self.x,self.y,self.c,self.is_p = x,y,c,is_p; self.sz,self.a,self.sp = 20,0,3
        self.tx,self.ty = x,y; self.h,self.mh = 100,100; self.al,self.hg = True,False
        self.lst,self.fr = pygame.time.get_ticks(),750
        self.shape = random.choice(PLAYER_SHAPES)
        self.color = random.choice(PLAYER_COLORS)
        # Watch Dogs - Habilidades de Hacking
        self.hack_skill = True if is_p else random.choice([True, False])
        self.shield_time = 0  # Tempo de escudo ativo
        self.detection_immunity = 0  # Imunidade a detecção de câmeras
    def draw(self,surf,ox=0,oy=0):
        if not self.al: return
        sx,sy = F_WS(self.x,self.y,ox,oy)
        pts = [(sx+self.sz*x*math.cos(self.a)-self.sz*y*math.sin(self.a), sy+self.sz*x*math.sin(self.a)+self.sz*y*math.cos(self.a)) for x,y in self.shape]
        
        # Watch Dogs - Efeito de escudo
        if self.shield_time > pygame.time.get_ticks():
            pygame.draw.circle(surf, C_HACK, (int(sx), int(sy)), self.sz + 10, 3)
        
        pygame.draw.polygon(surf,self.color,pts)
        hr = self.h/self.mh; pygame.draw.rect(surf,C_HBR,(sx-20,sy-30,40,5))
        pygame.draw.rect(surf,C_HBG,(sx-20,sy-30,40*hr,5))
        
        # Watch Dogs - Indicador de hacker
        if self.hack_skill:
            pygame.draw.circle(surf, C_CYBER, (int(sx-15), int(sy-15)), 5)
            pygame.draw.circle(surf, C_HACK, (int(sx-15), int(sy-15)), 3)
    def mt(self): # Move to Target
        if not self.al: return
        d = math.hypot(self.tx-self.x,self.ty-self.y)
        if d > self.sp:
            self.a = math.atan2(self.ty-self.y,self.tx-self.x)
            self.x+=self.sp*math.cos(self.a); self.y+=self.sp*math.sin(self.a)
        else: self.x,self.y = self.tx,self.ty
        # Colisão com a borda da ilha
        dic = math.hypot(self.x-ICX,self.y-ICY)
        if dic > IR-self.sz: self.x,self.y = ICX+(self.x-ICX)*(IR-self.sz)/dic,ICY+(self.y-ICY)*(IR-self.sz)/dic; self.tx,self.ty = self.x,self.y
    def td(self,amt): # Take Damage
        self.h-=amt; self.al = self.h>0
    def hl(self,amt): self.h=min(self.mh,self.h+amt) # Heal
    def cs(self): return self.hg and (pygame.time.get_ticks()-self.lst > self.fr) # Can Shoot
    def sh(self,tx,ty,sh): # Shoot
        if not self.al or not self.cs(): return None
        self.lst = pygame.time.get_ticks();
        # Tiro nasce na posição do atirador (self.x, self.y)
        # E vai na direção do ângulo atual do atirador (self.a)
        target_x = self.x + math.cos(self.a) * 1000 # Um ponto bem longe na direção do atirador
        target_y = self.y + math.sin(self.a) * 1000
        return B(self.x,self.y,target_x,target_y,C_Y,sh)

class B: # Bullet
    def __init__(self,sx,sy,tx,ty,c,sh):
        self.x,self.y,self.c,self.sh = sx,sy,c,sh; self.r,self.sp,self.d,self.ac = 5,BULLET_SPEED,10,True # Usando BULLET_SPEED
        self.a = math.atan2(ty-sy,tx-sx); self.vx,self.vy = self.sp*math.cos(self.a),self.sp*math.sin(self.a)
    def draw(self,surf,ox=0,oy=0):
        if self.ac: pygame.draw.circle(surf,self.c,(int(F_WS(self.x,self.y,ox,oy)[0]),int(F_WS(self.x,self.y,ox,oy)[1])),self.r)
    def up(self, dt): # Update - Adicionado dt para movimento independente de FPS
        if not self.ac: return
        self.x+=self.vx * dt * 60 # Multiplica por 60 para manter velocidade em 60 FPS
        self.y+=self.vy * dt * 60
        # Colisão com a borda da ilha - A bala ainda pode ser removida se sair da ilha
        if math.hypot(self.x-ICX,self.y-ICY) > IR+self.r: self.ac = False

class GP: # Gun Pickup
    def __init__(self,x,y): self.x,self.y,self.r,self.ac = x,y,15,True
    def draw(self,surf,ox=0,oy=0):
        if self.ac:
            sx,sy = F_WS(self.x,self.y,ox,oy)
            pygame.draw.circle(surf,C_O,(int(sx),int(sy)),self.r)
            pygame.draw.line(surf,C_BR,(sx-10,sy),(sx+10,sy),3)
            pygame.draw.line(surf,C_BR,(sx,sy-10),(sx,sy+10),3)

class HP: # Health Pickup
    def __init__(self,x,y): self.x,self.y,self.r,self.ac = x,y,15,True; self.ha = 25 # Heal Amount
    def draw(self,surf,ox=0,oy=0):
        if self.ac:
            sx,sy = F_WS(self.x,self.y,ox,oy)
            pygame.draw.circle(surf,C_HL,(int(sx),int(sy)),self.r)
            pygame.draw.line(surf,C_W,(sx-8,sy),(sx+8,sy),3)
            pygame.draw.line(surf,C_W,(sx,sy-8),(sx,sy+8),3)

# Watch Dogs - Classes do Sistema de Hacking
class SecurityCamera:
    def __init__(self, x, y, detection_range, angle=0, sweep=False):
        self.x, self.y = x, y
        self.range = detection_range
        self.angle = angle
        self.base_angle = angle
        self.sweep = sweep
        self.sweep_direction = 1
        self.active = True
        self.detected_players = []
        self.last_sweep_time = pygame.time.get_ticks()
        
    def update(self):
        current_time = pygame.time.get_ticks()
        if self.sweep and self.active:
            if current_time - self.last_sweep_time > 50:  # Atualiza a cada 50ms
                self.angle += self.sweep_direction * 2
                if abs(self.angle - self.base_angle) > 60:  # Amplitude de 120 graus
                    self.sweep_direction *= -1
                self.last_sweep_time = current_time
    
    def detect_player(self, player):
        if not self.active or player.detection_immunity > pygame.time.get_ticks():
            return False
            
        dist = math.hypot(player.x - self.x, player.y - self.y)
        if dist <= self.range:
            # Verifica se o jogador está no cone de visão
            angle_to_player = math.degrees(math.atan2(player.y - self.y, player.x - self.x))
            angle_diff = abs(angle_to_player - self.angle)
            if angle_diff > 180:
                angle_diff = 360 - angle_diff
            
            if angle_diff <= 30:  # Cone de 60 graus
                return True
        return False
    
    def draw(self, surf, ox=0, oy=0):
        sx, sy = F_WS(self.x, self.y, ox, oy)
        
        if self.active:
            # Desenha o cone de visão
            cone_color = (*C_CAMERA, 50)  # Semi-transparente
            cone_surface = pygame.Surface((self.range*2, self.range*2), pygame.SRCALPHA)
            
            # Calcula os pontos do cone
            angle_rad = math.radians(self.angle)
            left_angle = angle_rad - math.radians(30)
            right_angle = angle_rad + math.radians(30)
            
            center = (self.range, self.range)
            left_point = (center[0] + self.range * math.cos(left_angle), 
                         center[1] + self.range * math.sin(left_angle))
            right_point = (center[0] + self.range * math.cos(right_angle), 
                          center[1] + self.range * math.sin(right_angle))
            
            pygame.draw.polygon(cone_surface, cone_color, [center, left_point, right_point])
            surf.blit(cone_surface, (sx - self.range, sy - self.range))
            
            # Desenha a câmera
            pygame.draw.circle(surf, C_CAMERA, (int(sx), int(sy)), 15)
            pygame.draw.circle(surf, C_BL, (int(sx), int(sy)), 8)
            
            # Linha indicando direção
            end_x = sx + 20 * math.cos(math.radians(self.angle))
            end_y = sy + 20 * math.sin(math.radians(self.angle))
            pygame.draw.line(surf, C_W, (sx, sy), (end_x, end_y), 3)
        else:
            # Câmera desativada
            pygame.draw.circle(surf, C_GR, (int(sx), int(sy)), 15)
            pygame.draw.line(surf, C_R, (sx-10, sy-10), (sx+10, sy+10), 3)
            pygame.draw.line(surf, C_R, (sx-10, sy+10), (sx+10, sy-10), 3)

class HackTarget:
    def __init__(self, x, y, hack_type):
        self.x, self.y = x, y
        self.type = hack_type
        self.hacked = False
        self.cooldown = 0
        self.effect_time = 0
        
    def can_hack(self):
        return not self.hacked and self.cooldown < pygame.time.get_ticks()
        
    def hack(self):
        if self.can_hack():
            self.hacked = True
            self.effect_time = pygame.time.get_ticks() + 10000  # Efeito dura 10 segundos
            self.cooldown = pygame.time.get_ticks() + HACK_COOLDOWN
            return True
        return False
        
    def update(self):
        if self.hacked and self.effect_time < pygame.time.get_ticks():
            self.hacked = False
            
    def draw(self, surf, ox=0, oy=0):
        sx, sy = F_WS(self.x, self.y, ox, oy)
        
        # Cor baseada no tipo e estado
        if self.hacked:
            color = C_HACK
            pulse = int(127 + 128 * math.sin(pygame.time.get_ticks() * 0.01))
            color = (0, pulse, 0)
        elif self.can_hack():
            color = C_SIGNAL
        else:
            color = C_GR
            
        # Desenha baseado no tipo
        if self.type == "power":
            pygame.draw.rect(surf, color, (sx-15, sy-15, 30, 30))
            pygame.draw.line(surf, C_ELECTRIC, (sx-10, sy), (sx+10, sy), 3)
            pygame.draw.line(surf, C_ELECTRIC, (sx, sy-10), (sx, sy+10), 3)
        elif self.type == "signal":
            pygame.draw.circle(surf, color, (int(sx), int(sy)), 15)
            # Ondas de sinal
            for i in range(3):
                pygame.draw.circle(surf, color, (int(sx), int(sy)), 20 + i*10, 2)
        elif self.type == "trap":
            pygame.draw.polygon(surf, color, [(sx, sy-15), (sx-13, sy+10), (sx+13, sy+10)])
            pygame.draw.circle(surf, C_R, (int(sx), int(sy-5)), 5)
        elif self.type == "shield":
            pygame.draw.circle(surf, color, (int(sx), int(sy)), 15, 5)
            pygame.draw.circle(surf, color, (int(sx), int(sy)), 8)
            
        # Indicador de cooldown
        if not self.can_hack() and not self.hacked:
            remaining = (self.cooldown - pygame.time.get_ticks()) / HACK_COOLDOWN
            arc_length = remaining * 360
            # pygame.draw.arc não suporta bem arcos, então usamos círculos menores
            if remaining > 0:
                pygame.draw.circle(surf, C_R, (int(sx), int(sy-25)), int(10 * remaining))

# 4. Gerenciamento do Jogo (G = Game)

# Watch Dogs - Funções de Hacking
def perform_hack(player, hack_target):
    """Executa o hack baseado no tipo do alvo"""
    if hack_target.hack():
        if hack_target.type == "power":
            # Desativa todas as câmeras temporariamente
            for camera in security_cameras:
                camera.active = False
            # Reativa após 10 segundos
            return "Câmeras desativadas!"
            
        elif hack_target.type == "signal":
            # Jammming - imunidade a detecção
            player.detection_immunity = pygame.time.get_ticks() + 8000
            return "Sinal interferido - você está invisível!"
            
        elif hack_target.type == "trap":
            # Cria uma explosão que causa dano em área
            explosion_radius = 80
            for agent in [p] + bts:
                if agent != player and agent.al:
                    dist = math.hypot(agent.x - hack_target.x, agent.y - hack_target.y)
                    if dist <= explosion_radius:
                        agent.td(30)
            return "Armadilha explosiva ativada!"
            
        elif hack_target.type == "shield":
            # Ativa escudo temporário
            player.shield_time = pygame.time.get_ticks() + 15000
            return "Escudo ativado!"
    
    return None

def check_camera_detection():
    """Verifica se algum jogador foi detectado pelas câmeras"""
    detected = []
    for camera in security_cameras:
        camera.update()
        for agent in [p] + bts:
            if agent.al and camera.detect_player(agent):
                detected.append(agent)
                # Marca o jogador no radar dos bots por um tempo
                if hasattr(agent, 'detected_time'):
                    agent.detected_time = pygame.time.get_ticks() + 5000
                else:
                    agent.detected_time = pygame.time.get_ticks() + 5000
    return detected

def get_nearest_hack_target(player):
    """Encontra o alvo de hack mais próximo dentro do alcance"""
    nearest = None
    min_dist = float('inf')
    
    for target in hack_targets:
        if target.can_hack():
            dist = math.hypot(player.x - target.x, player.y - target.y)
            if dist <= HACKING_RANGE and dist < min_dist:
                nearest = target
                min_dist = dist
                
    return nearest

def G_R(): # Reset Game
    global p, p2, bts, blts, gns, hps, lhps, OX, OY, gs, DZ_Current_Radius, total_players_alive
    global security_cameras, hack_targets, hack_message, hack_message_time
    
    px,py = F_RP(); p = A(px,py,C_W,is_p=True); p.tx,p.ty,p.hg = p.x,p.y,False # Jogador 1
    px2,py2 = F_RP(); p2 = A(px2,py2,C_Y,is_p=True); p2.tx,p2.ty,p2.hg = p2.x,p2.y,False # Jogador 2 (amarelo)

    nb = 8 # Menos bots para 2 players
    bts = []
    for _ in range(nb):
        bx,by = F_RP(); bt = A(bx,by,C_R,is_p=False)
        bt.sp,bt.tx,bt.ty,bt.hg = random.uniform(2,4),F_RP()[0],F_RP()[1],False
        bts.append(bt)

    blts = [];
    n_g = 12
    gns = [GP(*F_RP(mdfe=50)) for _ in range(n_g)]
    hps = []; lhps = pygame.time.get_ticks()

    OX,OY = 0,0
    gs = GS_P
    DZ_Current_Radius = DZ_Max_Radius
    total_players_alive = 2 + len(bts)
    
    # Watch Dogs - Inicializa sistema de hacking
    security_cameras = []
    for cam_data in CAMERAS:
        security_cameras.append(SecurityCamera(cam_data["x"], cam_data["y"], 
                                             cam_data["range"], cam_data["angle"], 
                                             cam_data["sweep"]))
    
    hack_targets = []
    for target_data in HACK_TARGETS:
        hack_targets.append(HackTarget(target_data["x"], target_data["y"], target_data["type"]))
    
    hack_message = ""
    hack_message_time = 0


# 5. Loop Principal
r,clk,dt = True,pygame.time.Clock(),0
lhps = pygame.time.get_ticks() # Last Health Pickup Spawn

# Watch Dogs - Variáveis globais
security_cameras = []
hack_targets = []
hack_message = ""
hack_message_time = 0

G_R() # Reset game

# 2 Jogadores locais
PLAYER2_KEYS = {
    'up': pygame.K_i,
    'down': pygame.K_k,
    'left': pygame.K_j,
    'right': pygame.K_l,
    'shoot': pygame.K_u,
    'hack': pygame.K_o
}

# Adiciona variáveis de movimento contínuo
move_up = move_down = move_left = move_right = shoot = hack = False
move2_up = move2_down = move2_left = move2_right = shoot2 = hack2 = False

while r:
    for e in pygame.event.get():
        if e.type == pygame.QUIT: r = False
        if e.type == pygame.MOUSEBUTTONDOWN:
            if gs in (GS_W,GS_L): G_R()
            elif gs == GS_P:
                mx,my = e.pos
                if p.al and SR.collidepoint(mx,my) and p.hg:
                    blt = p.sh(0, 0, p)
                    if blt: blts.append(blt)
                else:
                    p.tx,p.ty = mx, my
        # Controles de teclado contínuos
        if e.type == pygame.KEYDOWN and gs == GS_P:
            if p.al:
                if e.key in (pygame.K_w, pygame.K_UP): move_up = True
                if e.key in (pygame.K_s, pygame.K_DOWN): move_down = True
                if e.key in (pygame.K_a, pygame.K_LEFT): move_left = True
                if e.key in (pygame.K_d, pygame.K_RIGHT): move_right = True
                if e.key == pygame.K_SPACE and p.hg: shoot = True
                if e.key == pygame.K_e and p.hack_skill: hack = True
            if p2.al:
                if e.key == PLAYER2_KEYS['up']: move2_up = True
                if e.key == PLAYER2_KEYS['down']: move2_down = True
                if e.key == PLAYER2_KEYS['left']: move2_left = True
                if e.key == PLAYER2_KEYS['right']: move2_right = True
                if e.key == PLAYER2_KEYS['shoot'] and p2.hg: shoot2 = True
                if e.key == PLAYER2_KEYS['hack'] and p2.hack_skill: hack2 = True
        if e.type == pygame.KEYUP and gs == GS_P:
            if p.al:
                if e.key in (pygame.K_w, pygame.K_UP): move_up = False
                if e.key in (pygame.K_s, pygame.K_DOWN): move_down = False
                if e.key in (pygame.K_a, pygame.K_LEFT): move_left = False
                if e.key in (pygame.K_d, pygame.K_RIGHT): move_right = False
                if e.key == pygame.K_SPACE: shoot = False
                if e.key == pygame.K_e: hack = False
            if p2.al:
                if e.key == PLAYER2_KEYS['up']: move2_up = False
                if e.key == PLAYER2_KEYS['down']: move2_down = False
                if e.key == PLAYER2_KEYS['left']: move2_left = False
                if e.key == PLAYER2_KEYS['right']: move2_right = False
                if e.key == PLAYER2_KEYS['shoot']: shoot2 = False
                if e.key == PLAYER2_KEYS['hack']: hack2 = False
    # Movimento contínuo dos players
    if gs == GS_P:
        if p.al:
            move_speed = 6
            if move_up: p.ty -= move_speed
            if move_down: p.ty += move_speed
            if move_left: p.tx -= move_speed
            if move_right: p.tx += move_speed
            if shoot and p.hg and p.cs():
                blt = p.sh(0, 0, p)
                if blt: blts.append(blt)
                shoot = False
            if hack and p.hack_skill:
                nearest_target = get_nearest_hack_target(p)
                if nearest_target:
                    message = perform_hack(p, nearest_target)
                    if message:
                        hack_message = message
                        hack_message_time = pygame.time.get_ticks() + 3000
                hack = False
        if p2.al:
            move_speed = 6
            if move2_up: p2.ty -= move_speed
            if move2_down: p2.ty += move_speed
            if move2_left: p2.tx -= move_speed
            if move2_right: p2.tx += move_speed
            if shoot2 and p2.hg and p2.cs():
                blt = p2.sh(0, 0, p2)
                if blt: blts.append(blt)
                shoot2 = False
            if hack2 and p2.hack_skill:
                nearest_target = get_nearest_hack_target(p2)
                if nearest_target:
                    message = perform_hack(p2, nearest_target)
                    if message:
                        hack_message = message
                        hack_message_time = pygame.time.get_ticks() + 3000
                hack2 = False
    # Watch Dogs - Atualiza sistemas
    check_camera_detection()
    for target in hack_targets:
        target.update()
    
    # Reativa câmeras após hack de energia
    for target in hack_targets:
        if target.type == "power" and not target.hacked:
            for camera in security_cameras:
                if not camera.active:
                    camera.active = True

    # Lógica de encolhimento da zona de dano
    DZ_Current_Radius -= DZ_Shrink_Rate * dt # Encolhe com base no tempo de frame
    # NOTA: Não há mais um limite mínimo para DZ_Current_Radius, ela pode se tornar negativa
    # o que efetivamente significa que a tempestade cobriu toda a área.
    
    # Dano da Zona de Dano
    for agent in [p] + bts:
        if agent.al:
            dist_from_center = math.hypot(agent.x - ICX, agent.y - ICY)
            # A condição de dano agora é baseada se o agente está FORA do raio atual da tempestade
            # Se o raio da tempestade for 0 ou negativo, significa que a tempestade está em toda parte.
            if dist_from_center > DZ_Current_Radius - agent.sz: # Se o jogador/bot está fora da zona segura
                agent.td(DZ_Damage * dt) # Causa dano contínuo

    ct = pygame.time.get_ticks()
    if ct-lhps > HPSI: hps.append(HP(*F_RP(mdfe=50))); lhps = ct

    # Atualiza a contagem de jogadores vivos
    total_players_alive = (1 if p.al else 0) + sum(1 for bt in bts if bt.al)


    if p.al:
        p.mt()
        OX,OY = 0,0 # A câmera permanece fixa
        for cl in [gns,hps]:
            for it in cl[:]:
                if it.ac and math.hypot(p.x-it.x,p.y-it.y) < p.sz+it.r:
                    if isinstance(it,GP): p.hg = True
                    elif isinstance(it,HP): p.hl(it.ha)
                    it.ac = False; break

    for bt in bts:
        if bt.al:
            target_found = False
            dist_from_center = math.hypot(bt.x - ICX, bt.y - ICY)

            # Watch Dogs - Bots podem tentar hackear também
            if bt.hack_skill and random.random() < 0.01:  # 1% chance por frame
                nearest_hack = get_nearest_hack_target(bt)
                if nearest_hack:
                    perform_hack(bt, nearest_hack)

            # Prioridade 1: Sair da Zona de Dano (se estiver dentro)
            if dist_from_center > DZ_Current_Radius - bt.sz:
                # Calcula um ponto seguro em direção ao centro da ilha
                safe_radius = max(0, DZ_Current_Radius - bt.sz - 10) # Garante que o raio não seja negativo para cálculo
                angle_to_center = math.atan2(ICY - bt.y, ICX - bt.x)
                safe_x = ICX + math.cos(angle_to_center) * safe_radius
                safe_y = ICY + math.sin(angle_to_center) * safe_radius
                bt.tx, bt.ty = safe_x, safe_y
                target_found = True

            # Prioridade 2: Pegar HP se a vida estiver baixa e HP visível (se não estiver fugindo da zona)
            if not target_found and bt.h < bt.mh * 0.7:
                closest_hp, min_dist_hp = None, float('inf')
                for hp in hps:
                    if hp.ac:
                        dist = math.hypot(bt.x - hp.x, bt.y - hp.y)
                        if dist < min_dist_hp and dist < PVR:
                            closest_hp, min_dist_hp = hp, dist
                if closest_hp:
                    bt.tx, bt.ty = closest_hp.x, closest_hp.y
                    target_found = True
                    if math.hypot(bt.x - closest_hp.x, bt.y - closest_hp.y) < bt.sz + closest_hp.r:
                        bt.hl(closest_hp.ha)
                        closest_hp.ac = False
                        bt.tx, bt.ty = F_RP(mdfe=40)

            # Prioridade 3: Pegar arma se não tiver e arma visível (se não estiver fugindo da zona/curando)
            if not target_found and not bt.hg:
                closest_gun, min_dist_gun = None, float('inf')
                for gun in gns:
                    if gun.ac:
                        dist = math.hypot(bt.x - gun.x, bt.y - gun.y)
                        if dist < min_dist_gun and dist < PVR:
                            closest_gun, min_dist_gun = gun, dist
                if closest_gun:
                    bt.tx, bt.ty = closest_gun.x, closest_gun.y
                    target_found = True
                    if math.hypot(bt.x - closest_gun.x, bt.y - closest_gun.y) < bt.sz + closest_gun.r:
                        bt.hg, closest_gun.ac = True, False
                        bt.tx, bt.ty = F_RP(mdfe=40)

            # Prioridade 4: Atacar ou andar aleatoriamente (se não tiver prioridades acima)
            if not target_found and bt.hg:
                tt, mdtt = None, float('inf')
                potential_targets = [p] + [_ for _ in bts if _.al and _ != bt]
                
                # Watch Dogs - Bots perseguem jogadores detectados pelas câmeras
                for pt in potential_targets:
                    if pt.al:
                        d = math.hypot(bt.x - pt.x, bt.y - pt.y)
                        # Aumenta o alcance se o alvo foi detectado
                        detection_bonus = 100 if hasattr(pt, 'detected_time') and pt.detected_time > pygame.time.get_ticks() else 0
                        if d < PVR + detection_bonus and d < mdtt:
                            mdtt, tt = d, pt
                            
                if tt:
                    if bt.cs():
                        # O tiro do bot segue o ângulo atual dele
                        blt = bt.sh(0, 0, bt) # Argumentos tx, ty não são usados para direção, apenas para inicializar
                        if blt: blts.append(blt)
                    bt.tx, bt.ty = tt.x, tt.y
                    target_found = True
                elif random.random() < 0.005:
                    bt.tx, bt.ty = F_RP(mdfe=40)
                    target_found = True
            
            # Se não encontrou alvo de prioridade, anda aleatoriamente
            if not target_found:
                if random.random() < 0.01:
                    bt.tx, bt.ty = F_RP(mdfe=40)

            bt.mt()

    for blt in blts[:]:
        if blt.ac:
            blt.up(dt); tgts = [p]+bts # Passa dt para a bala
            for tg in tgts:
                if tg.al and math.hypot(blt.x-tg.x,blt.y-tg.y) < tg.sz+blt.r and blt.sh!=tg:
                    tg.td(blt.d); blt.ac = False; break
        if not blt.ac: blts.remove(blt)

    bts = [_ for _ in bts if _.al]
    gns = [_ for _ in gns if _.ac]
    hps = [_ for _ in hps if _.ac]
    if not p.al: gs = GS_L
    elif not bts: gs = GS_W

    # --- Renderização do Jogo ---

    # Nuvens
    for cx,cy,cw,ch in CLOUDS:
        pygame.draw.ellipse(s, C_CLOUD, (cx,cy,cw,ch))
    # Montanhas
    for mx,my,mw,mh in MOUNTAINS:
        pygame.draw.ellipse(s, C_MOUNTAIN, (mx,my,mw,mh))
    # Casas Pacman
    for house in PAC_HOUSES:
        pygame.draw.rect(s, (255,220,180), house, border_radius=30)
        pygame.draw.rect(s, C_PACWALL, house, 8, border_radius=30)
    # Paredes Pacman
    for wall in PAC_WALLS:
        pygame.draw.rect(s, C_PACWALL, wall)
    # Obstáculos
    for obs in OBSTACLES:
        pygame.draw.rect(s, C_OBS, obs)

    # 1. Preenche a tela com a cor de fundo (mar azul)
    s.fill(C_B) 

    # Desenha a ilha
    pygame.draw.circle(s, C_G, F_WS(ICX,ICY,OX,OY), IR)

    # Desenha todos os elementos do jogo
    for ld in L:
        F_DL(s, ld, OX, OY)
        F_DLN(s, ld, OX, OY)

    for g in gns: F_DE(s, g, OX, OY)
    for hp in hps: F_DE(s, hp, OX, OY)
    
    # Watch Dogs - Desenha sistemas de hacking
    for camera in security_cameras:
        camera.draw(s, OX, OY)
    for target in hack_targets:
        target.draw(s, OX, OY)
    
    for blt in blts: F_DE(s, blt, OX, OY)
    
    # Renderização dos jogadores
    for bt in bts: F_DE(s, bt, OX, OY)
    if p.al: p.draw(s, OX, OY)
    if p2.al: p2.draw(s, OX, OY)

    # Cria e blita a superfície da "sombra" (zona de dano)
    shadow_surface = pygame.Surface((CW, CH), pygame.SRCALPHA)
    # Define a cor preta com o valor de transparência DZ_Transparency
    shadow_surface.fill((0, 0, 0, DZ_Transparency))

    # Desenha um círculo "transparente" com o raio da zona de dano
    # Usa max(0, ...) para evitar erros de renderização com raio negativo,
    # embora a lógica de dano continue funcionando mesmo com raio negativo.
    pygame.draw.circle(shadow_surface, (0, 0, 0, 0), (ICX, ICY), int(max(0, DZ_Current_Radius)))
    s.blit(shadow_surface, (0,0))

    # Renderiza os elementos da UI (botão de atirar)
    pygame.draw.rect(s,SC,SR,border_radius=10)
    s.blit(F_M.render("ATIRAR",True,C_W),F_M.render("ATIRAR",True,C_W).get_rect(center=SR.center))

    # Contador de Jogadores Vivos
    players_text = F_M.render(f"Vivos: {total_players_alive}", True, C_W)
    s.blit(players_text, (10, 10)) # Posição no canto superior esquerdo
    
    # Watch Dogs - UI de Hacking
    if p.hack_skill:
        # Indicador de hacker
        hack_text = F_S.render("HACKER", True, C_HACK)
        s.blit(hack_text, (10, 50))
        
        # Mostra alvo de hack próximo
        nearest_hack = get_nearest_hack_target(p)
        if nearest_hack and p.al:
            dist = math.hypot(p.x - nearest_hack.x, p.y - nearest_hack.y)
            hack_ui_text = F_S.render(f"[E] Hack {nearest_hack.type.upper()} ({int(dist)}m)", True, C_SIGNAL)
            s.blit(hack_ui_text, (10, 75))
        
        # Status de escudo
        if p.shield_time > pygame.time.get_ticks():
            remaining = (p.shield_time - pygame.time.get_ticks()) / 1000
            shield_text = F_S.render(f"ESCUDO: {remaining:.1f}s", True, C_HACK)
            s.blit(shield_text, (10, 100))
            
        # Status de invisibilidade
        if p.detection_immunity > pygame.time.get_ticks():
            remaining = (p.detection_immunity - pygame.time.get_ticks()) / 1000
            invis_text = F_S.render(f"INVISÍVEL: {remaining:.1f}s", True, C_SIGNAL)
            s.blit(invis_text, (10, 125))
    
    # Mensagens de hack
    if hack_message_time > pygame.time.get_ticks():
        message_surface = F_M.render(hack_message, True, C_HACK)
        message_rect = message_surface.get_rect(center=(CW//2, 100))
        
        # Fundo semi-transparente
        bg_surface = pygame.Surface((message_rect.width + 20, message_rect.height + 10), pygame.SRCALPHA)
        bg_surface.fill((0, 0, 0, 150))
        s.blit(bg_surface, (message_rect.x - 10, message_rect.y - 5))
        s.blit(message_surface, message_rect)

    # Telas de Game Over (DESENHADAS POR ÚLTIMO, COBRINDO TUDO)
    if gs == GS_W: 
        ol = pygame.Surface((CW,CH),pygame.SRCALPHA)
        ol.fill((0,100,0,150)) # Camada verde semi-transparente
        s.blit(ol,(0,0))
        s.blit(F_L.render("VOCÊ GANHOU!",True,C_W),F_L.render("VOCÊ GANHOU!",True,C_W).get_rect(center=(CW//2,CH//2-50)))
        s.blit(F_M.render("Clique para Jogar Novamente",True,C_W),F_M.render("Clique para Jogar Novamente",True,C_W).get_rect(center=(CW//2,CH//2+50)))
    elif gs == GS_L: 
        ol = pygame.Surface((CW,CH),pygame.SRCALPHA)
        ol.fill((100,0,0,150)) # Camada vermelha semi-transparente
        s.blit(ol,(0,0))
        s.blit(F_L.render("VOCÊ PERDEU!",True,C_W),F_L.render("VOCÊ PERDEU!",True,C_W).get_rect(center=(CW//2,CH//2-50)))
        s.blit(F_M.render("Clique para Jogar Novamente",True,C_W),F_M.render("Clique para Jogar Novamente",True,C_W).get_rect(center=(CW//2,CH//2+50)))

    pygame.display.flip()
    dt = clk.tick(60) / 1000.0 # dt em segundos

pygame.quit()