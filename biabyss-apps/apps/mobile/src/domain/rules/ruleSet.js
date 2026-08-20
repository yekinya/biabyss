// @ts-check

export const RULE_SET = Object.freeze({
  id: 'microscope-field-v1',
  simulationHz: 60,
  maxCatchUpSteps: 5,
  world: Object.freeze({
    viewportSpanMultiplier: 6,
    viewportAreaMultiplier: 36,
  }),
  player: Object.freeze({
    initialMass: 36,
    startProtectionMs: 6000,
    acceleration: 94,
    dragPerSecond: 0.84,
    maxSpeed: 178,
    deadZone: 10,
    wriggleAmplitude: 25,
    wriggleFrequency: 2.4,
  }),
  mass: Object.freeze({
    radiusScale: 4,
    cellAbsorbRatio: 1.12,
    contactDepthRatio: 0.74,
    nutrientEfficiency: 1,
    cellEfficiency: 0.28,
    maximum: 520,
  }),
  npc: Object.freeze({
    count: 54,
    awarenessRadius: 430,
    acceleration: 36,
    maxSpeed: 82,
    massMin: 14,
    massMax: 118,
    safeSpawnDistance: 330,
  }),
  nutrient: Object.freeze({
    targetCount: 320,
    massMin: 0.7,
    massMax: 1.45,
  }),
  rendering: Object.freeze({
    dprMaximum: 1.5,
    ambientParticles: 1800,
    internalParticlesPerCell: 5,
    trailCapacity: 640,
    trailLifetimeSeconds: 1.75,
  }),
})
