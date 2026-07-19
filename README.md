# Dead Weird

A horror-action HTML5 survival game built by JD.

## Features
- First-person and third-person gameplay
- Zombie survival mechanics
- Mobile-ready controls
- Atmospheric horror maps
- HTML5 + JavaScript engine

## Development
Built with:
- HTML5
- CSS3
- JavaScript

# 🧟 DEAD WEIRD
**A zombie shooter where zombies call you to apologize.**

> *"Ugly Truths. Beautiful Lights."* — Catfish Heads · catfishheads.site

## 🎮 Play
Open `deadweird.html` in any browser. No install. No server. No internet required.

## 📁 Files
| File | Size | Description |
|------|------|-------------|
| `deadweird.html` | 28KB | Screens, HUD, manual, mobile controls |
| `deadweird.css` | 24KB | Styling, animations, responsive |
| `deadweird.js` | 430KB | Full game engine + embedded sprite assets |

All three files must be in the **same folder**.

## 🕹️ Controls
| Key | Action |
|-----|--------|
| WASD | Move |
| Mouse | Aim (click canvas to lock in FP) |
| **LEFT CLICK** | 🔫 **SHOOT** |
| R | Reload |
| 1-4 | Switch weapon |
| V | Toggle FP / Top Down |

## ⚔️ Weapons
| # | Weapon | Unlocks |
|---|--------|---------|
| 1 | 🔫 Pistol | Always |
| 2 | 🦆 Duck Gun | Wave 2 |
| 3 | 🍕 Pizza Cannon | Wave 4 |
| 4 | 🎸 Guitar Shockwave | Wave 6 |

## 🎪 11 Weird Events
Disco Fever · Phone Call · Pizza Delivery · Cow Stampede · Smooth Jazz ·
Duck Rain · Makeover · Vendor Rage · TV Static · Birthday Bonus · **👽 Alien Invasion**

## 🛸 New: UFO Alien Invasion
A UFO flies in and shoots alien beams at the player.
**Shoot it down** for a 500×wave score bonus.
The player and zombies now render using real sprite sheet assets.

## 🔊 New: Layered Sound FX
- Pistol: crack + mechanical click + bass thump
- Zombie groans by type (normal/fast/tank/boss)
- Squeaky wet footsteps when walking over blood decals
- Alien beam sound on UFO fire

## 💰 Monetization (Stripe)
1. Sign up at stripe.com
2. Add `<script src="https://js.stripe.com/v3/"></script>` to `<head>`
3. Replace `handlePayment()` in `deadweird.js` with Stripe card payment
4. On success call `unlockFullGame()`

## 🚀 Deploy Free
- **Netlify**: drag folder → instant live URL
- **itch.io**: upload the itch zip, set as HTML game
- **GitHub Pages**: Settings → Pages → main → /root

## 👤 Credits
Built by **Joey Donner** · Catfish Heads · catfishheads.site
Sprite assets: player.jpg (top-down), green_zombie.jpg (walk cycles)

## 📄 License
MIT
