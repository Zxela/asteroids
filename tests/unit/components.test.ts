/**
 * Component Unit Tests
 *
 * Tests for ECS component classes:
 * - Transform, Velocity, Physics, Collider, Renderable, Health, Player
 * - All components should be pure data containers
 * - Components should implement the Component interface
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { Vector3 } from 'three'

// Components to be implemented
import {
  Transform,
  Velocity,
  Physics,
  Collider,
  Renderable,
  Health,
  Player,
} from '../../src/components'

// Types for verification
import type {
  TransformComponent,
  VelocityComponent,
  PhysicsComponent,
  ColliderComponent,
  RenderableComponent,
  HealthComponent,
  PlayerComponent,
  CollisionLayer,
  MeshType,
  MaterialType,
} from '../../src/types/components'

describe('Transform Component', () => {
  describe('constructor', () => {
    it('should create with default values', () => {
      const transform = new Transform()

      expect(transform.position).toBeInstanceOf(Vector3)
      expect(transform.rotation).toBeInstanceOf(Vector3)
      expect(transform.scale).toBeInstanceOf(Vector3)

      expect(transform.position.x).toBe(0)
      expect(transform.position.y).toBe(0)
      expect(transform.position.z).toBe(0)

      expect(transform.rotation.x).toBe(0)
      expect(transform.rotation.y).toBe(0)
      expect(transform.rotation.z).toBe(0)

      expect(transform.scale.x).toBe(1)
      expect(transform.scale.y).toBe(1)
      expect(transform.scale.z).toBe(1)
    })

    it('should create with custom position', () => {
      const position = new Vector3(10, 20, 30)
      const transform = new Transform(position)

      expect(transform.position.x).toBe(10)
      expect(transform.position.y).toBe(20)
      expect(transform.position.z).toBe(30)
    })

    it('should create with custom position, rotation, and scale', () => {
      const position = new Vector3(5, 10, 15)
      const rotation = new Vector3(Math.PI / 4, Math.PI / 2, 0)
      const scale = new Vector3(2, 2, 2)

      const transform = new Transform(position, rotation, scale)

      expect(transform.position).toBe(position)
      expect(transform.rotation).toBe(rotation)
      expect(transform.scale).toBe(scale)
    })
  })

  describe('type property', () => {
    it('should have type "transform"', () => {
      const transform = new Transform()
      expect(transform.type).toBe('transform')
    })

    it('should be readonly at TypeScript level', () => {
      const transform = new Transform()
      // TypeScript enforces readonly at compile time
      // This test just verifies the type property exists and has correct value
      expect(transform.type).toBe('transform')
    })
  })

  describe('type compatibility', () => {
    it('should satisfy TransformComponent interface', () => {
      const transform = new Transform()
      // Type assertion to verify interface compatibility
      const _component: TransformComponent = transform
      expect(_component.type).toBe('transform')
    })
  })
})

describe('Velocity Component', () => {
  describe('constructor', () => {
    it('should create with default values (zero velocity)', () => {
      const velocity = new Velocity()

      expect(velocity.linear).toBeInstanceOf(Vector3)
      expect(velocity.angular).toBeInstanceOf(Vector3)

      expect(velocity.linear.x).toBe(0)
      expect(velocity.linear.y).toBe(0)
      expect(velocity.linear.z).toBe(0)

      expect(velocity.angular.x).toBe(0)
      expect(velocity.angular.y).toBe(0)
      expect(velocity.angular.z).toBe(0)
    })

    it('should create with custom linear velocity', () => {
      const linear = new Vector3(100, 50, 0)
      const velocity = new Velocity(linear)

      expect(velocity.linear.x).toBe(100)
      expect(velocity.linear.y).toBe(50)
      expect(velocity.linear.z).toBe(0)
    })

    it('should create with custom linear and angular velocity', () => {
      const linear = new Vector3(100, 50, 0)
      const angular = new Vector3(0, 0, Math.PI)

      const velocity = new Velocity(linear, angular)

      expect(velocity.linear).toBe(linear)
      expect(velocity.angular).toBe(angular)
    })
  })

  describe('type property', () => {
    it('should have type "velocity"', () => {
      const velocity = new Velocity()
      expect(velocity.type).toBe('velocity')
    })
  })

  describe('type compatibility', () => {
    it('should satisfy VelocityComponent interface', () => {
      const velocity = new Velocity()
      const _component: VelocityComponent = velocity
      expect(_component.type).toBe('velocity')
    })
  })
})

describe('Physics Component', () => {
  describe('constructor', () => {
    it('should create with default values', () => {
      const physics = new Physics()

      expect(physics.mass).toBe(1)
      expect(physics.damping).toBe(0.98)
      expect(physics.angularDamping).toBe(0.01)
      expect(physics.maxSpeed).toBe(300)
      expect(physics.wrapScreen).toBe(false)
    })

    it('should create with custom values', () => {
      const physics = new Physics(5, 0.95, 500, true, 0.5)

      expect(physics.mass).toBe(5)
      expect(physics.damping).toBe(0.95)
      expect(physics.maxSpeed).toBe(500)
      expect(physics.wrapScreen).toBe(true)
      expect(physics.angularDamping).toBe(0.5)
    })

    it('should allow partial custom values', () => {
      const physics = new Physics(10)

      expect(physics.mass).toBe(10)
      expect(physics.damping).toBe(0.98) // default
      expect(physics.maxSpeed).toBe(300) // default
      expect(physics.wrapScreen).toBe(false) // default
      expect(physics.angularDamping).toBe(0.01) // default
    })
  })

  describe('type property', () => {
    it('should have type "physics"', () => {
      const physics = new Physics()
      expect(physics.type).toBe('physics')
    })
  })

  describe('type compatibility', () => {
    it('should satisfy PhysicsComponent interface', () => {
      const physics = new Physics()
      const _component: PhysicsComponent = physics
      expect(_component.type).toBe('physics')
    })
  })
})

describe('Collider Component', () => {
  describe('constructor', () => {
    it('should create with default values (sphere collider)', () => {
      const collider = new Collider()

      expect(collider.shape).toBe('sphere')
      expect(collider.radius).toBe(1)
      expect(collider.layer).toBe('asteroid')
      expect(collider.mask).toEqual([])
    })

    it('should create sphere collider with custom radius', () => {
      const collider = new Collider('sphere', 20, 'player', ['asteroid', 'powerup'])

      expect(collider.shape).toBe('sphere')
      expect(collider.radius).toBe(20)
      expect(collider.layer).toBe('player')
      expect(collider.mask).toEqual(['asteroid', 'powerup'])
    })

    it('should create box collider with size', () => {
      const size = new Vector3(10, 20, 30)
      const collider = new Collider('box', undefined, 'boss', ['projectile'], size)

      expect(collider.shape).toBe('box')
      expect(collider.size).toBe(size)
      expect(collider.layer).toBe('boss')
      expect(collider.mask).toEqual(['projectile'])
    })
  })

  describe('type property', () => {
    it('should have type "collider"', () => {
      const collider = new Collider()
      expect(collider.type).toBe('collider')
    })
  })

  describe('type compatibility', () => {
    it('should satisfy ColliderComponent interface', () => {
      const collider = new Collider()
      const _component: ColliderComponent = collider
      expect(_component.type).toBe('collider')
    })
  })
})

describe('Renderable Component', () => {
  describe('constructor', () => {
    it('should create with required meshType', () => {
      const renderable = new Renderable('ship')

      expect(renderable.meshType).toBe('ship')
      expect(renderable.material).toBe('standard')
      expect(renderable.visible).toBe(true)
      expect(renderable.objectId).toBeUndefined()
    })

    it('should create with custom material', () => {
      const renderable = new Renderable('asteroid_large', 'emissive')

      expect(renderable.meshType).toBe('asteroid_large')
      expect(renderable.material).toBe('emissive')
    })

    it('should create with custom visibility', () => {
      const renderable = new Renderable('projectile_default', 'transparent', false)

      expect(renderable.visible).toBe(false)
    })

    it('should support all mesh types', () => {
      const meshTypes: MeshType[] = [
        'ship',
        'asteroid_large',
        'asteroid_medium',
        'asteroid_small',
        'projectile_default',
        'projectile_spread',
        'projectile_laser',
        'projectile_missile',
        'powerup_shield',
        'powerup_rapidfire',
        'powerup_multishot',
        'powerup_extralife',
        'boss_destroyer',
        'boss_carrier',
      ]

      for (const meshType of meshTypes) {
        const renderable = new Renderable(meshType)
        expect(renderable.meshType).toBe(meshType)
      }
    })

    it('should support all material types', () => {
      const materialTypes: MaterialType[] = ['standard', 'emissive', 'transparent']

      for (const material of materialTypes) {
        const renderable = new Renderable('ship', material)
        expect(renderable.material).toBe(material)
      }
    })
  })

  describe('type property', () => {
    it('should have type "renderable"', () => {
      const renderable = new Renderable('ship')
      expect(renderable.type).toBe('renderable')
    })
  })

  describe('type compatibility', () => {
    it('should satisfy RenderableComponent interface', () => {
      const renderable = new Renderable('ship')
      const _component: RenderableComponent = renderable
      expect(_component.type).toBe('renderable')
    })
  })
})

describe('Health Component', () => {
  describe('constructor', () => {
    it('should create with default values', () => {
      const health = new Health()

      expect(health.max).toBe(1)
      expect(health.current).toBe(1)
      expect(health.invulnerable).toBe(false)
      expect(health.invulnerabilityTimer).toBe(0)
    })

    it('should create with custom max health', () => {
      const health = new Health(100)

      expect(health.max).toBe(100)
      expect(health.current).toBe(100) // current defaults to max
    })

    it('should create with custom current and max health', () => {
      const health = new Health(100, 50)

      expect(health.max).toBe(100)
      expect(health.current).toBe(50)
    })
  })

  describe('takeDamage method', () => {
    it('should reduce current health by damage amount', () => {
      const health = new Health(100)

      health.takeDamage(30)

      expect(health.current).toBe(70)
    })

    it('should not reduce health below zero', () => {
      const health = new Health(50)

      health.takeDamage(100)

      expect(health.current).toBe(0)
    })

    it('should not take damage when invulnerable', () => {
      const health = new Health(100)
      health.invulnerable = true

      health.takeDamage(50)

      expect(health.current).toBe(100)
    })
  })

  describe('setInvulnerable method', () => {
    it('should set invulnerable to true and set timer', () => {
      const health = new Health()

      health.setInvulnerable(3000)

      expect(health.invulnerable).toBe(true)
      expect(health.invulnerabilityTimer).toBe(3000)
    })
  })

  describe('type property', () => {
    it('should have type "health"', () => {
      const health = new Health()
      expect(health.type).toBe('health')
    })
  })

  describe('type compatibility', () => {
    it('should satisfy HealthComponent interface', () => {
      const health = new Health()
      const _component: HealthComponent = health
      expect(_component.type).toBe('health')
    })
  })
})

describe('Player Component', () => {
  describe('constructor', () => {
    it('should create with default values', () => {
      const player = new Player()

      expect(player.lives).toBe(3)
      expect(player.score).toBe(0)
    })

    it('should create with custom lives', () => {
      const player = new Player(5)

      expect(player.lives).toBe(5)
      expect(player.score).toBe(0)
    })
  })

  describe('addScore method', () => {
    it('should increase score by given points', () => {
      const player = new Player()

      player.addScore(100)

      expect(player.score).toBe(100)
    })

    it('should accumulate score across multiple calls', () => {
      const player = new Player()

      player.addScore(100)
      player.addScore(50)
      player.addScore(25)

      expect(player.score).toBe(175)
    })
  })

  describe('loseLife method', () => {
    it('should decrease lives by one', () => {
      const player = new Player(3)

      player.loseLife()

      expect(player.lives).toBe(2)
    })

    it('should not reduce lives below zero', () => {
      const player = new Player(1)

      player.loseLife()
      player.loseLife()

      expect(player.lives).toBe(0)
    })
  })

  describe('type property', () => {
    it('should have type "player"', () => {
      const player = new Player()
      expect(player.type).toBe('player')
    })
  })

  describe('type compatibility', () => {
    it('should satisfy PlayerComponent interface', () => {
      const player = new Player()
      const _component: PlayerComponent = player
      expect(_component.type).toBe('player')
    })
  })
})

describe('Component Index Exports', () => {
  it('should export all component classes', () => {
    expect(Transform).toBeDefined()
    expect(Velocity).toBeDefined()
    expect(Physics).toBeDefined()
    expect(Collider).toBeDefined()
    expect(Renderable).toBeDefined()
    expect(Health).toBeDefined()
    expect(Player).toBeDefined()
  })

  it('should allow component instantiation', () => {
    expect(() => new Transform()).not.toThrow()
    expect(() => new Velocity()).not.toThrow()
    expect(() => new Physics()).not.toThrow()
    expect(() => new Collider()).not.toThrow()
    expect(() => new Renderable('ship')).not.toThrow()
    expect(() => new Health()).not.toThrow()
    expect(() => new Player()).not.toThrow()
  })
})

describe('Component Interface Compliance', () => {
  it('should be usable with ECS World', () => {
    // All components should be plain objects compatible with Component type
    const components = [
      new Transform(),
      new Velocity(),
      new Physics(),
      new Collider(),
      new Renderable('ship'),
      new Health(),
      new Player(),
    ]

    for (const component of components) {
      expect(component).toBeDefined()
      expect(typeof component).toBe('object')
      expect(component.type).toBeDefined()
    }
  })
})
