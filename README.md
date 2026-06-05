# 🧟 DEAD WEIRD

**A zombie shooter where zombies call you to philosophically apologize.**

> *"Ugly Truths. Beautiful Lights."*  
> — Catfish Heads · [catfishheads.site](https://catfishheads.site)

---

## 🎮 Play Now

Open `deadweird.html` in any browser. No install. No server. No internet required.

**[▶ Play Free Demo](https://deadweird.netlify.app)** ← deploy to Netlify in 60 seconds (see below)

---

## 📁 Files

| File | Size | Description |
|------|------|-------------|
| `deadweird.html` | 28KB | All screens, HUD, manual, mobile controls |
| `deadweird.css` | 24KB | Full styling — dark theme, animations, responsive |
| `deadweird.js` | 71KB | Complete game engine — 1,576 lines |

All three files must be in the **same folder**.

---

## 🕹️ Controls

### Desktop
| Key | Action |
|-----|--------|
| W A S D | Move |
| Mouse | Aim (click canvas to lock in FP) |
| **LEFT CLICK** | 🔫 **SHOOT** |
| R | Reload |
| 1 · 2 · 3 · 4 | Switch weapon |
| V | Toggle First Person / Top Down |
| ESC | Release mouse |

### Mobile
| Control | Action |
|---------|--------|
| Left joystick | Move |
| Right swipe | Aim / turn |
| 🔴 **FIRE button** | **SHOOT** — hold to auto-fire |
| ⟳ button | Reload |
| Weapon slots | Tap to switch |

---

## ⚔️ Weapons

| Key | Weapon | Unlocks | Special |
|-----|--------|---------|---------|
| 1 | 🔫 Pistol | Always | Fast reload |
| 2 | 🦆 Duck Gun | Wave 2 | QUACKS on impact |
| 3 | 🍕 Pizza Cannon | Wave 4 | Explosive splash |
| 4 | 🎸 Guitar Shockwave | Wave 6 | **Kills ALL zombies on screen** |

---

## 🎪 10 Random Weird Events

- 🎪 **Disco Fever** — zombies stop to dance 6 seconds
- ☎️ **Phone Call** — zombie calls to philosophically apologize
- 🍕 **Pizza Delivery** — drone heals +40 HP mid-battle
- 🐄 **Cow Stampede** — zombie cows charge across the map
- 🎵 **Smooth Jazz** — everyone slows 50%
- 🌧️ **Duck Rain** — ammo falls from the sky
- 💅 **Makeover Event** — zombies distracted by imaginary mirrors
- 🤖 **Vendor Rage** — angry vending machine fights on your side
- 📺 **TV Static** — all zombies stunned
- 🎂 **Birthday Bonus** — surprise +500 score

---

## 🔧 Technical

- **Renderer:** Custom DDA raycaster (First Person, like original Doom) + Canvas 2D (Top Down)
- **Audio:** Web Audio API — fully procedural, no audio files needed
- **Physics:** AABB collision detection on a 24×24 tile map
- **No dependencies** — pure HTML5, zero libraries, zero build tools
- **Works offline** — everything is self-contained

### Engine Features
- Dual view modes (FP raycaster + TP overhead) switchable mid-game
- Professional sprite system: full zombie anatomy (legs, arms, eyes, head), player with gun arm
- Dynamic point lighting (player torch, muzzle flash, bullet glow)
- Persistent blood decals on the floor
- Brick wall textures via DDA hit-position sampling
- Pointer lock API for smooth FP mouse aiming
- Web Audio procedural SFX (no MP3/WAV files)
- Mobile touch controls: virtual joystick + aim zone + fire button

---

## 💰 Monetization

The game has a **free demo (waves 1-3)** and a **full unlock at $4.99**.

### To activate real payments (Stripe):

1. Sign up at [stripe.com](https://stripe.com)
2. Add to `<head>` in `deadweird.html`:
   ```html
   <script src="https://js.stripe.com/v3/"></script>
   ```
3. In `deadweird.js`, find `handlePayment()` and replace with:
   ```js
   async function handlePayment(){
     const stripe = Stripe('pk_live_YOUR_KEY_HERE');
     // fetch('/create-payment-intent') from your backend
     // then stripe.confirmCardPayment(clientSecret)
     // on success: unlockFullGame()
   }
   ```
4. Deploy a simple backend (Glitch.com is free) to create payment intents
5. See full Stripe setup guide in the Catfish Heads business kit

---

## 🚀 Deploy to Netlify (free, 60 seconds)

1. Go to [netlify.com](https://netlify.com) and sign up free
2. Drag the entire `dead-weird` folder onto the Netlify dashboard
3. You get a live URL like `deadweird.netlify.app` instantly
4. Share that link everywhere

---

## 📤 Submit to Free Game Platforms

| Platform | URL | Notes |
|----------|-----|-------|
| **itch.io** | itch.io | Upload HTML file, set as browser game, earn 100% |
| **Newgrounds** | newgrounds.com | Huge community for weird/experimental games |
| **GameJolt** | gamejolt.com | Large younger audience |
| **Kongregate** | kongregate.com | Ad revenue sharing |
| **CrazyGames** | crazygames.com/developers | 30M+ monthly visitors |
| **Product Hunt** | producthunt.com | Launch for 500–2,000 day-one visitors |

---

## 👤 About

Built by **Joey Donner**, creator of [Catfish Heads](https://catfishheads.site) — a blog about surviving homelessness, Christ consciousness, and finding beautiful light in ugly places.

This is the first game I ever made. Built with AI tools and zero prior game development experience.

If a homeless survival blogger can ship a zombie shooter from scratch, you can build whatever you keep putting off.

---

## 📄 License

MIT — do whatever you want with it. Credit appreciated but not required.

---

*Dead Weird · Catfish Heads · 2026*
