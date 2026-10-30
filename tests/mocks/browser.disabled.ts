export const worker = {
  start: async () => {
    throw new Error('O MSW não está disponível no build de produção.')
  },
}
