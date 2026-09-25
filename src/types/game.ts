export interface Point2D {
  x: number;
  y: number;
}

export interface CastleCoreData extends Point2D {
  health: number;
  tier: number;
}

export type EntityType =
  | 'spawner_skeleton'
  | 'spawner_bat'
  | 'spawner_axe_armor'
  | 'trap_pendulum'
  | 'trap_ballista'
  | 'trap_flame_gargoyle'
  | 'door_iron_grate'
  | 'door_relic_lock'
  | 'switch_pressure_plate'
  | 'switch_lever'
  | 'vault_blood_well'
  | 'boss_crypt_guardian';

export interface EntityConfig {
  instanceId: string;
  type: EntityType;
  x: number; // tile coordinates
  y: number;
  properties?: {
    patrolRadius?: number;
    triggerTargetId?: string;
    requiredRelic?: 'DoubleJump' | 'MistForm' | 'BatFlight' | 'IronKey';
    fireInterval?: number;
    facing?: 'left' | 'right' | 'up' | 'down';
  };
}

export interface CastleLayers {
  background: number[];
  collision: number[];
  hazard: number[];
}

export interface PlayerCastleMap {
  mapId: string;
  ownerId: string;
  castleName: string;
  version: number;
  tier: number;
  gridWidth: number;
  gridHeight: number;
  tileSize: 16 | 32;
  budgetUsed: number;
  maxBudget: number;
  spawnPoint: Point2D;
  castleCore: CastleCoreData;
  layers: CastleLayers;
  entities: EntityConfig[];
  checksum: string;
}

export type GameMode = 'architect' | 'validation' | 'raid';

export interface PlayerStats {
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  hearts: number;
  maxHearts: number;
  level: number;
  exp: number;
  sanguineEssence: number;
  darkGold: number;
  relics: {
    doubleJump: boolean;
    mistForm: boolean;
    batFlight: boolean;
  };
}
