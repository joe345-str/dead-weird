// ================================================================
//  SPRITE CACHE SYSTEM v2.0 - Robust Loading + Error Handling
// ================================================================

const SpriteCache = {
  cache: new Map(),
  loading: new Map(),
  fallbacks: new Map(),
  
  /**
   * Load a sprite with proper async handling
   * Returns a promise that resolves when image is fully loaded
   */
  async load(src) {
    // Return cached if available
    if (this.cache.has(src)) {
      const cached = this.cache.get(src);
      if (cached.complete) return cached;
    }
    
    // Return existing loading promise
    if (this.loading.has(src)) {
      return this.loading.get(src);
    }
    
    // Create new loading promise
    const loadPromise = new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        this.cache.set(src, img);
        this.loading.delete(src);
        resolve(img);
      };
      
      img.onerror = () => {
        console.warn(`[SpriteCache] Failed to load: ${src}`);
        this.loading.delete(src);
        
        // Try fallback or create placeholder
        const fallback = this.createFallback(src);
        this.cache.set(src, fallback);
        reject(new Error(`Failed to load sprite: ${src}`));
      };
      
      img.src = src;
    });
    
    this.loading.set(src, loadPromise);
    return loadPromise;
  },
  
  /**
   * Get sprite synchronously (may not be loaded)
   * For use in render loop when you know sprite exists
   */
  get(src) {
    if (this.cache.has(src)) {
      return this.cache.get(src);
    }
    
    // Create placeholder if not found
    const placeholder = this.createFallback(src);
    this.cache.set(src, placeholder);
    this.load(src).catch(err => console.error(err));
    
    return placeholder;
  },
  
  /**
   * Preload multiple sprites and wait for all
   */
  async preloadAll(srcs) {
    const promises = srcs.map(src => this.load(src));
    return Promise.allSettled(promises);
  },
  
  /**
   * Create a canvas-based fallback sprite
   */
  createFallback(src, width = 64, height = 64) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    
    // Draw checkerboard pattern
    ctx.fillStyle = '#ff00ff';
    ctx.fillRect(0, 0, width, height);
    
    ctx.fillStyle = '#000000';
    for (let x = 0; x < width; x += 16) {
      for (let y = 0; y < height; y += 16) {
        if ((x + y) / 16 % 2 === 0) {
          ctx.fillRect(x, y, 16, 16);
        }
      }
    }
    
    // Add text label
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('ERR', width / 2, height / 2);
    
    // Mark as fallback
    canvas.isFallback = true;
    canvas.complete = true;
    
    return canvas;
  },
  
  /**
   * Clear cache (useful for scene transitions)
   */
  clear() {
    this.cache.clear();
    this.loading.clear();
  },
  
  /**
   * Get cache statistics for debugging
   */
  stats() {
    return {
      cached: this.cache.size,
      loading: this.loading.size,
      totalMemory: Array.from(this.cache.values())
        .reduce((sum, img) => sum + (img.width * img.height * 4), 0) / 1024 / 1024 + ' MB'
    };
  }
};

/**
 * Preload game sprites at startup
 */
async function initSpriteCache() {
  const SPRITES_TO_PRELOAD = [
    '/assets/sprites/player.png',
    '/assets/sprites/zombie.png',
    '/assets/sprites/bullet.png',
    '/assets/sprites/explosion.png'
  ];
  
  try {
    console.log('[SpriteCache] Preloading sprites...');
    await SpriteCache.preloadAll(SPRITES_TO_PRELOAD);
    console.log('[SpriteCache] Preload complete', SpriteCache.stats());
  } catch (err) {
    console.warn('[SpriteCache] Some sprites failed to preload:', err);
  }
}

/**
 * Enhanced sprite loader that waits for image completion
 */
async function loadSpriteAsync(src) {
  return SpriteCache.load(src);
}

/**
 * Safe sprite drawing with fallback
 */
function drawSpriteIfReady(ctx, sprite, x, y, width, height) {
  if (!sprite) {
    // Draw placeholder
    ctx.fillStyle = '#ff00ff80';
    ctx.fillRect(x, y, width, height);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('?', x + width / 2, y + height / 2);
    return false;
  }
  
  if (sprite.complete || sprite.isFallback) {
    ctx.drawImage(sprite, x, y, width, height);
    return true;
  }
  
  // Still loading - draw placeholder
  ctx.fillStyle = '#00ff0080';
  ctx.fillRect(x, y, width, height);
  return false;
}

/**
 * Frame-based sprite animation helper
 */
class SpriteAnimation {
  constructor(img, frameWidth, frameHeight, totalFrames, fps) {
    this.img = img;
    this.frameWidth = frameWidth;
    this.frameHeight = frameHeight;
    this.totalFrames = totalFrames;
    this.fps = fps;
    this.currentFrame = 0;
    this.elapsed = 0;
  }
  
  update(deltaTime) {
    this.elapsed += deltaTime;
    const frameTime = 1 / this.fps;
    
    while (this.elapsed >= frameTime) {
      this.currentFrame = (this.currentFrame + 1) % this.totalFrames;
      this.elapsed -= frameTime;
    }
  }
  
  draw(ctx, x, y, scale = 1) {
    if (!this.img || !this.img.complete) return false;
    
    const sx = this.currentFrame * this.frameWidth;
    const sy = 0;
    const width = this.frameWidth * scale;
    const height = this.frameHeight * scale;
    
    ctx.drawImage(
      this.img,
      sx, sy, this.frameWidth, this.frameHeight,
      x - width / 2, y - height / 2, width, height
    );
    
    return true;
  }
}
