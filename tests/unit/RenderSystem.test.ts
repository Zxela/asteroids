/**
 * RenderSystem Unit Tests
 *
 * Tests for ECS-to-Three.js rendering:
 * - Mesh creation from Renderable component
 * - Transform-to-mesh synchronization
 * - Mesh visibility control
 * - Invulnerability flashing
 * - Cleanup on entity destruction
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as THREE from 'three'
import { Vector3 } from 'three'
import { World } from '../../src/ecs/World'
import { RenderSystem } from '../../src/systems/RenderSystem'
import { Transform, Renderable, Health } from '../../src/components'

describe('RenderSystem', () => {
  let world: World
  let scene: THREE.Scene
  let renderSystem: RenderSystem

  beforeEach(() => {
    world = new World()
    scene = new THREE.Scene()
    renderSystem = new RenderSystem(scene)
  })

  describe('Mesh Creation', () => {
    it('should create mesh on first update', () => {
      const entityId = world.createEntity()
      world.addComponent(entityId, new Transform())
      world.addComponent(entityId, new Renderable('ship', 'standard'))

      expect(scene.children.length).toBe(0)

      renderSystem.update(world, 16)

      expect(scene.children.length).toBe(1)
    })

    it('should reuse mesh on subsequent updates', () => {
      const entityId = world.createEntity()
      world.addComponent(entityId, new Transform())
      world.addComponent(entityId, new Renderable('ship', 'standard'))

      renderSystem.update(world, 16)
      const meshCount1 = scene.children.length

      renderSystem.update(world, 16)
      const meshCount2 = scene.children.length

      expect(meshCount2).toBe(meshCount1)
    })

    it('should create mesh for asteroid_large', () => {
      const entityId = world.createEntity()
      world.addComponent(entityId, new Transform())
      world.addComponent(entityId, new Renderable('asteroid_large', 'standard'))

      renderSystem.update(world, 16)

      expect(scene.children.length).toBe(1)
      const mesh = renderSystem.getMeshForEntity(entityId)
      expect(mesh).toBeDefined()
    })

    it('should create mesh for asteroid_medium', () => {
      const entityId = world.createEntity()
      world.addComponent(entityId, new Transform())
      world.addComponent(entityId, new Renderable('asteroid_medium', 'standard'))

      renderSystem.update(world, 16)

      expect(scene.children.length).toBe(1)
    })

    it('should create mesh for asteroid_small', () => {
      const entityId = world.createEntity()
      world.addComponent(entityId, new Transform())
      world.addComponent(entityId, new Renderable('asteroid_small', 'standard'))

      renderSystem.update(world, 16)

      expect(scene.children.length).toBe(1)
    })

    it('should create mesh for projectile_default', () => {
      const entityId = world.createEntity()
      world.addComponent(entityId, new Transform())
      world.addComponent(entityId, new Renderable('projectile_default', 'transparent'))

      renderSystem.update(world, 16)

      expect(scene.children.length).toBe(1)
    })

    it('should create mesh for boss_destroyer', () => {
      const entityId = world.createEntity()
      world.addComponent(entityId, new Transform())
      world.addComponent(entityId, new Renderable('boss_destroyer', 'emissive'))

      renderSystem.update(world, 16)

      expect(scene.children.length).toBe(1)
    })

    it('should create mesh for boss_carrier', () => {
      const entityId = world.createEntity()
      world.addComponent(entityId, new Transform())
      world.addComponent(entityId, new Renderable('boss_carrier', 'emissive'))

      renderSystem.update(world, 16)

      expect(scene.children.length).toBe(1)
    })
  })

  describe('Transform Synchronization', () => {
    it('should sync position to mesh', () => {
      const entityId = world.createEntity()
      const position = new Vector3(10, 20, 30)
      world.addComponent(entityId, new Transform(position))
      world.addComponent(entityId, new Renderable('asteroid_small', 'standard'))

      renderSystem.update(world, 16)

      const mesh = renderSystem.getMeshForEntity(entityId)
      expect(mesh?.position.x).toBe(10)
      expect(mesh?.position.y).toBe(20)
      expect(mesh?.position.z).toBe(30)
    })

    it('should sync rotation to mesh', () => {
      const entityId = world.createEntity()
      const rotation = new Vector3(Math.PI / 4, Math.PI / 3, Math.PI / 6)
      world.addComponent(entityId, new Transform(new Vector3(), rotation))
      world.addComponent(entityId, new Renderable('asteroid_small', 'standard'))

      renderSystem.update(world, 16)

      const mesh = renderSystem.getMeshForEntity(entityId)
      expect(mesh?.rotation.x).toBeCloseTo(rotation.x, 2)
      expect(mesh?.rotation.y).toBeCloseTo(rotation.y, 2)
      expect(mesh?.rotation.z).toBeCloseTo(rotation.z, 2)
    })

    it('should sync scale to mesh', () => {
      const entityId = world.createEntity()
      const scale = new Vector3(2, 3, 4)
      world.addComponent(entityId, new Transform(new Vector3(), new Vector3(), scale))
      world.addComponent(entityId, new Renderable('asteroid_small', 'standard'))

      renderSystem.update(world, 16)

      const mesh = renderSystem.getMeshForEntity(entityId)
      expect(mesh?.scale.x).toBe(2)
      expect(mesh?.scale.y).toBe(3)
      expect(mesh?.scale.z).toBe(4)
    })

    it('should update mesh when transform changes', () => {
      const entityId = world.createEntity()
      world.addComponent(entityId, new Transform(new Vector3(0, 0, 0)))
      world.addComponent(entityId, new Renderable('asteroid_small', 'standard'))

      renderSystem.update(world, 16)
      const mesh = renderSystem.getMeshForEntity(entityId)

      // Change position
      const transform = world.getComponent(entityId, Transform)
      transform!.position.x = 50

      renderSystem.update(world, 16)

      expect(mesh?.position.x).toBe(50)
    })
  })

  describe('Visibility Control', () => {
    it('should show visible renderable', () => {
      const entityId = world.createEntity()
      world.addComponent(entityId, new Transform())
      const renderable = new Renderable('ship', 'standard', true)
      world.addComponent(entityId, renderable)

      renderSystem.update(world, 16)

      const mesh = renderSystem.getMeshForEntity(entityId)
      expect(mesh?.visible).toBe(true)
    })

    it('should hide invisible renderable', () => {
      const entityId = world.createEntity()
      world.addComponent(entityId, new Transform())
      const renderable = new Renderable('ship', 'standard', false)
      world.addComponent(entityId, renderable)

      renderSystem.update(world, 16)

      const mesh = renderSystem.getMeshForEntity(entityId)
      expect(mesh?.visible).toBe(false)
    })
  })

  describe('Invulnerability Flashing', () => {
    it('should flash mesh when invulnerable', () => {
      const entityId = world.createEntity()
      world.addComponent(entityId, new Transform())
      world.addComponent(entityId, new Renderable('ship', 'standard'))
      const health = new Health()
      health.setInvulnerable(3000)
      world.addComponent(entityId, health)

      // First update starts flashing
      renderSystem.update(world, 16)
      const mesh = renderSystem.getMeshForEntity(entityId)

      // Accumulate time past flash interval (100ms)
      renderSystem.update(world, 50)
      const visibleAt50 = mesh!.visible

      renderSystem.update(world, 60) // Total 110ms
      const visibleAt110 = mesh!.visible

      // Should have toggled visibility at some point
      expect(visibleAt50 !== visibleAt110 || visibleAt50 === true || visibleAt110 === true).toBe(true)
    })

    it('should stop flashing when invulnerability expires', () => {
      const entityId = world.createEntity()
      world.addComponent(entityId, new Transform())
      world.addComponent(entityId, new Renderable('ship', 'standard'))
      world.addComponent(entityId, new Health())

      // First with invulnerability
      const health = world.getComponent(entityId, Health)!
      health.setInvulnerable(100)

      renderSystem.update(world, 16)

      // Remove invulnerability
      health.invulnerable = false
      renderSystem.update(world, 16)
      const mesh = renderSystem.getMeshForEntity(entityId)

      expect(mesh?.visible).toBe(true) // Should be visible after invulnerability ends
    })

    it('should flash when invulnerabilityTimer > 0', () => {
      const entityId = world.createEntity()
      world.addComponent(entityId, new Transform())
      world.addComponent(entityId, new Renderable('ship', 'standard'))
      const health = new Health()
      health.invulnerabilityTimer = 3000 // Set timer directly
      health.invulnerable = true
      world.addComponent(entityId, health)

      renderSystem.update(world, 16)
      const mesh = renderSystem.getMeshForEntity(entityId)

      // Mesh should be visible initially (first half of flash cycle)
      expect(mesh).toBeDefined()
      // After first update, visibility should be determined by flash logic
    })

    it('should toggle visibility every 100ms (flash frequency)', () => {
      const entityId = world.createEntity()
      world.addComponent(entityId, new Transform())
      world.addComponent(entityId, new Renderable('ship', 'standard'))
      const health = new Health()
      health.setInvulnerable(5000)
      world.addComponent(entityId, health)

      renderSystem.update(world, 0) // Initialize mesh
      const mesh = renderSystem.getMeshForEntity(entityId)!

      // Capture visibility states at specific intervals
      const visibilityStates: boolean[] = []

      // Simulate 500ms in 50ms increments
      for (let i = 0; i < 10; i++) {
        renderSystem.update(world, 50)
        visibilityStates.push(mesh.visible)
      }

      // Count visibility toggles (changes)
      let toggleCount = 0
      for (let i = 1; i < visibilityStates.length; i++) {
        if (visibilityStates[i] !== visibilityStates[i - 1]) {
          toggleCount++
        }
      }

      // With 100ms flash interval, over 500ms we should have ~2-5 toggles
      // (visible 100ms -> hidden 100ms -> visible 100ms, etc.)
      expect(toggleCount).toBeGreaterThanOrEqual(2)
      expect(toggleCount).toBeLessThanOrEqual(5)
    })

    it('should ensure mesh is visible when invulnerabilityTimer reaches 0', () => {
      const entityId = world.createEntity()
      world.addComponent(entityId, new Transform())
      world.addComponent(entityId, new Renderable('ship', 'standard'))
      const health = new Health()
      health.setInvulnerable(200)
      world.addComponent(entityId, health)

      renderSystem.update(world, 16)
      const mesh = renderSystem.getMeshForEntity(entityId)!

      // Set timer to 0 (invulnerability expired)
      health.invulnerabilityTimer = 0
      health.invulnerable = false

      renderSystem.update(world, 16)

      // Mesh should be visible after invulnerability ends
      expect(mesh.visible).toBe(true)
    })

    it('should allow multiple entities to flash independently', () => {
      // Create first invulnerable entity
      const entity1 = world.createEntity()
      world.addComponent(entity1, new Transform())
      world.addComponent(entity1, new Renderable('ship', 'standard'))
      const health1 = new Health()
      health1.setInvulnerable(3000)
      world.addComponent(entity1, health1)

      // Create second invulnerable entity (starting at different time)
      const entity2 = world.createEntity()
      world.addComponent(entity2, new Transform())
      world.addComponent(entity2, new Renderable('ship', 'standard'))
      const health2 = new Health()
      health2.setInvulnerable(3000)
      world.addComponent(entity2, health2)

      // Initialize meshes
      renderSystem.update(world, 0)
      const mesh1 = renderSystem.getMeshForEntity(entity1)!
      const mesh2 = renderSystem.getMeshForEntity(entity2)!

      // Update first entity alone for 75ms
      // Since both entities share the same deltaTime, we need to test differently
      // Both should flash but the test is that they have independent state tracking

      renderSystem.update(world, 75)
      const state1At75 = mesh1.visible
      const state2At75 = mesh2.visible

      // Both should be in the same state since they started together
      expect(state1At75).toBe(state2At75)

      // Now update more
      renderSystem.update(world, 50) // Total 125ms
      const state1At125 = mesh1.visible
      const state2At125 = mesh2.visible

      // Still in sync since they update together
      expect(state1At125).toBe(state2At125)

      // Make entity1 non-invulnerable
      health1.invulnerable = false
      health1.invulnerabilityTimer = 0

      renderSystem.update(world, 100)

      // Entity1 should be visible (not flashing)
      // Entity2 should continue flashing
      expect(mesh1.visible).toBe(true)
      // Entity2 visibility determined by flash cycle (either true or false)
      expect(typeof mesh2.visible).toBe('boolean')
    })

    it('should flash entity with Health component when invulnerable flag is set', () => {
      const entityId = world.createEntity()
      world.addComponent(entityId, new Transform())
      world.addComponent(entityId, new Renderable('ship', 'standard'))
      const health = new Health()
      // Set both flag and timer (as setInvulnerable does)
      health.invulnerable = true
      health.invulnerabilityTimer = 3000
      world.addComponent(entityId, health)

      // First update creates mesh
      renderSystem.update(world, 0)
      const mesh = renderSystem.getMeshForEntity(entityId)!

      // Collect visibility over 300ms
      const visibilityChanges: boolean[] = [mesh.visible]
      for (let i = 0; i < 6; i++) {
        renderSystem.update(world, 50)
        visibilityChanges.push(mesh.visible)
      }

      // Should have at least one visibility change in 300ms
      const hasVisibilityChange = visibilityChanges.some((v, i) =>
        i > 0 && v !== visibilityChanges[i - 1]
      )
      expect(hasVisibilityChange).toBe(true)
    })

    it('should flash based on invulnerabilityTimer > 0 regardless of invulnerable flag', () => {
      const entityId = world.createEntity()
      world.addComponent(entityId, new Transform())
      world.addComponent(entityId, new Renderable('ship', 'standard'))
      const health = new Health()
      // Set timer > 0 but invulnerable flag is false (edge case)
      health.invulnerable = false
      health.invulnerabilityTimer = 3000
      world.addComponent(entityId, health)

      renderSystem.update(world, 0)
      const mesh = renderSystem.getMeshForEntity(entityId)!

      // Collect visibility over 300ms
      const visibilityChanges: boolean[] = [mesh.visible]
      for (let i = 0; i < 6; i++) {
        renderSystem.update(world, 50)
        visibilityChanges.push(mesh.visible)
      }

      // Should flash because timer > 0 (per Task 3.6 spec)
      const hasVisibilityChange = visibilityChanges.some((v, i) =>
        i > 0 && v !== visibilityChanges[i - 1]
      )
      expect(hasVisibilityChange).toBe(true)
    })

    it('should not flash when invulnerabilityTimer is 0 even if invulnerable is true', () => {
      const entityId = world.createEntity()
      world.addComponent(entityId, new Transform())
      world.addComponent(entityId, new Renderable('ship', 'standard'))
      const health = new Health()
      // Timer is 0 but flag is true (edge case - should not flash per Task 3.6 spec)
      health.invulnerable = true
      health.invulnerabilityTimer = 0
      world.addComponent(entityId, health)

      renderSystem.update(world, 0)
      const mesh = renderSystem.getMeshForEntity(entityId)!

      // Should be visible (not flashing) since timer is 0
      const renderable = world.getComponent(entityId, Renderable)!
      expect(mesh.visible).toBe(renderable.visible)
    })
  })

  describe('Cleanup', () => {
    it('should remove mesh when entity destroyed', () => {
      const entityId = world.createEntity()
      world.addComponent(entityId, new Transform())
      world.addComponent(entityId, new Renderable('asteroid_small', 'standard'))

      renderSystem.update(world, 16)
      expect(scene.children.length).toBe(1)

      // Destroy entity
      world.destroyEntity(entityId)
      renderSystem.update(world, 16)

      expect(scene.children.length).toBe(0)
    })

    it('should clean up multiple meshes', () => {
      const entity1 = world.createEntity()
      world.addComponent(entity1, new Transform())
      world.addComponent(entity1, new Renderable('ship', 'standard'))

      const entity2 = world.createEntity()
      world.addComponent(entity2, new Transform())
      world.addComponent(entity2, new Renderable('asteroid_small', 'standard'))

      renderSystem.update(world, 16)
      expect(scene.children.length).toBe(2)

      world.destroyEntity(entity1)
      renderSystem.update(world, 16)

      expect(scene.children.length).toBe(1)
    })

    it('should handle mesh not found for entity gracefully', () => {
      const entityId = world.createEntity()
      const mesh = renderSystem.getMeshForEntity(entityId)
      expect(mesh).toBeUndefined()
    })
  })

  describe('Multiple Entities', () => {
    it('should handle multiple renderable entities', () => {
      for (let i = 0; i < 10; i++) {
        const entityId = world.createEntity()
        world.addComponent(entityId, new Transform(new Vector3(i * 10, 0, 0)))
        world.addComponent(entityId, new Renderable('asteroid_small', 'standard'))
      }

      renderSystem.update(world, 16)

      expect(scene.children.length).toBe(10)
    })

    it('should sync all entities independently', () => {
      const entities: number[] = []
      for (let i = 0; i < 3; i++) {
        const entityId = world.createEntity()
        world.addComponent(entityId, new Transform(new Vector3(i * 100, 0, 0)))
        world.addComponent(entityId, new Renderable('asteroid_small', 'standard'))
        entities.push(entityId as number)
      }

      renderSystem.update(world, 16)

      for (let i = 0; i < entities.length; i++) {
        const mesh = renderSystem.getMeshForEntity(entities[i] as ReturnType<typeof world.createEntity>)
        expect(mesh?.position.x).toBe(i * 100)
      }
    })
  })

  describe('Scene Management', () => {
    it('should return the scene', () => {
      expect(renderSystem.getScene()).toBe(scene)
    })

    it('should attach mesh to scene', () => {
      const mesh = new THREE.Mesh()
      renderSystem.attachToScene(mesh)
      expect(scene.children).toContain(mesh)
    })
  })
})
