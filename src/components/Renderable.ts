/**
 * Renderable Component
 *
 * Visual representation properties for the rendering system.
 */

import type { MaterialType, MeshType, RenderableComponent } from '../types/components'

/**
 * Renderable component class - defines visual appearance of an entity.
 *
 * @example
 * ```typescript
 * const shipRenderable = new Renderable('ship', 'standard', true)
 * const powerupRenderable = new Renderable('powerup_shield', 'emissive')
 * ```
 */
export class Renderable implements RenderableComponent {
  readonly type = 'renderable' as const

  /** Type of mesh to render */
  meshType: MeshType

  /** Material type */
  material: MaterialType

  /** Whether the entity is visible */
  visible: boolean

  /** Three.js Object3D UUID for scene synchronization */
  objectId?: string

  /**
   * Create a Renderable component.
   *
   * @param meshType - Type of mesh to render
   * @param material - Material type (default: 'standard')
   * @param visible - Initial visibility (default: true)
   */
  constructor(meshType: MeshType, material: MaterialType = 'standard', visible = true) {
    this.meshType = meshType
    this.material = material
    this.visible = visible
  }
}
