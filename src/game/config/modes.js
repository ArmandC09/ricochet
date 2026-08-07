export const GAME_TYPES = [
  {
    id: 'deathmatch',
    name: 'DEATHMATCH',
    description: 'Respawn after every death. First to 5 eliminations wins.',
  },
  {
    id: 'survival',
    name: 'SURVIVAL',
    description: '3 lives each, no respawn. Last one standing wins.',
  },
  {
    id: 'firstTo5',
    name: 'FIRST TO 5',
    description: 'Fast rounds — one hit ends the round. First to 5 round wins takes it.',
  },
]

export function getGameType(id) {
  return GAME_TYPES.find((g) => g.id === id) || GAME_TYPES[1]
}
