import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'

const PROJECT_ROOT = resolve(__dirname, '../..')

describe('Build Configuration', () => {
  describe('Configuration Files', () => {
    it('should have package.json with correct dependencies', () => {
      const packageJsonPath = resolve(PROJECT_ROOT, 'package.json')
      expect(existsSync(packageJsonPath)).toBe(true)

      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))

      // Core dependencies
      expect(packageJson.dependencies).toHaveProperty('three')
      expect(packageJson.dependencies).toHaveProperty('howler')

      // Dev dependencies
      expect(packageJson.devDependencies).toHaveProperty('typescript')
      expect(packageJson.devDependencies).toHaveProperty('vite')
      expect(packageJson.devDependencies).toHaveProperty('vitest')
      expect(packageJson.devDependencies).toHaveProperty('@biomejs/biome')

      // Required scripts
      expect(packageJson.scripts).toHaveProperty('build')
      expect(packageJson.scripts).toHaveProperty('dev')
      expect(packageJson.scripts).toHaveProperty('type-check')
      expect(packageJson.scripts).toHaveProperty('test')
      expect(packageJson.scripts).toHaveProperty('check')
    })

    it('should have tsconfig.json with strict mode enabled', () => {
      const tsconfigPath = resolve(PROJECT_ROOT, 'tsconfig.json')
      expect(existsSync(tsconfigPath)).toBe(true)

      const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf-8'))

      // Strict mode settings
      expect(tsconfig.compilerOptions.strict).toBe(true)
      expect(tsconfig.compilerOptions.strictNullChecks).toBe(true)
      expect(tsconfig.compilerOptions.strictFunctionTypes).toBe(true)

      // Target ES2020
      expect(tsconfig.compilerOptions.target).toBe('ES2020')

      // Path aliases
      expect(tsconfig.compilerOptions.paths).toHaveProperty('@/*')
    })

    it('should have vite.config.ts', () => {
      const viteConfigPath = resolve(PROJECT_ROOT, 'vite.config.ts')
      expect(existsSync(viteConfigPath)).toBe(true)
    })

    it('should have vitest.config.ts', () => {
      const vitestConfigPath = resolve(PROJECT_ROOT, 'vitest.config.ts')
      expect(existsSync(vitestConfigPath)).toBe(true)
    })

    it('should have biome.json', () => {
      const biomePath = resolve(PROJECT_ROOT, 'biome.json')
      expect(existsSync(biomePath)).toBe(true)
    })

    it('should have index.html with canvas element', () => {
      const indexHtmlPath = resolve(PROJECT_ROOT, 'index.html')
      expect(existsSync(indexHtmlPath)).toBe(true)

      const indexHtml = readFileSync(indexHtmlPath, 'utf-8')
      expect(indexHtml).toContain('id="game"')
      expect(indexHtml).toContain('<canvas')
      expect(indexHtml).toContain('src/main.ts')
    })
  })

  describe('Project Structure', () => {
    const expectedDirectories = [
      'src',
      'src/ecs',
      'src/components',
      'src/systems',
      'src/entities',
      'src/rendering',
      'src/game',
      'src/ui',
      'src/utils',
      'src/types',
      'src/config',
      'src/audio',
      'src/state',
      'tests/unit',
      'tests/integration',
      'tests/e2e',
      'public/assets'
    ]

    expectedDirectories.forEach((dir) => {
      it(`should have ${dir} directory`, () => {
        const dirPath = resolve(PROJECT_ROOT, dir)
        expect(existsSync(dirPath)).toBe(true)
      })
    })

    it('should have src/main.ts entry point', () => {
      const mainPath = resolve(PROJECT_ROOT, 'src/main.ts')
      expect(existsSync(mainPath)).toBe(true)
    })

    it('should have index files in each src subdirectory', () => {
      const srcDirs = [
        'ecs',
        'components',
        'systems',
        'entities',
        'rendering',
        'game',
        'ui',
        'utils',
        'types',
        'config',
        'audio',
        'state'
      ]

      srcDirs.forEach((dir) => {
        const indexPath = resolve(PROJECT_ROOT, `src/${dir}/index.ts`)
        expect(existsSync(indexPath)).toBe(true)
      })
    })
  })

  describe('Three.js Version', () => {
    it('should have Three.js r171 or later for WebGPU support', () => {
      const packageJsonPath = resolve(PROJECT_ROOT, 'package.json')
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))

      const threeVersion = packageJson.dependencies.three
      // Extract version number (removing ^ or ~ prefix)
      const versionMatch = threeVersion.match(/\d+\.\d+/)
      expect(versionMatch).not.toBeNull()

      if (versionMatch) {
        const majorMinor = parseFloat(versionMatch[0])
        // r171 = 0.171
        expect(majorMinor).toBeGreaterThanOrEqual(0.171)
      }
    })
  })
})
