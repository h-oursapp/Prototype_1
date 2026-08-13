export type ColorTheme = 'light' | 'dark'

export type GridSize = 2 | 3 | 4

export interface AppSettings {
  colorTheme: ColorTheme
  gridSize: GridSize
}

export const DEFAULT_GRID_SIZE: GridSize = 3

export const GRID_SIZE_OPTIONS: GridSize[] = [2, 3, 4]
