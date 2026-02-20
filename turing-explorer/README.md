# 🦁 Turing Pattern Explorer

An interactive web-based reaction-diffusion simulator that generates Turing patterns on animal silhouettes.

## 🎯 Features

- **4 Animal Silhouettes**: Leopard, Zebra, Giraffe, and Cheetah
- **Adjustable Parameters**: Real-time control of feed and kill rates
- **Phase Space Diagram**: Visual guide showing pattern regimes (spots, stripes, mixed)
- **Pattern Presets**: Quick access to classic spot, stripe, and mixed patterns
- **Interactive Canvas**: Click to add chemical B and watch patterns emerge
- **Pure Vanilla JavaScript**: No dependencies, runs entirely in the browser

## 🧬 How It Works

This simulator implements the **Gray-Scott reaction-diffusion model**, which describes how two chemicals (A and B) interact and diffuse over time. The mathematical equations are:

```
∂A/∂t = dA∇²A - AB² + f(1-A)
∂B/∂t = dB∇²B + AB² - (k+f)B
```

Where:
- `dA` and `dB` are diffusion rates
- `f` is the feed rate
- `k` is the kill rate
- `∇²` is the Laplacian operator (models diffusion)

Different combinations of feed and kill rates produce different patterns:
- **Spots**: Higher feed rate (f ≈ 0.055, k ≈ 0.062)
- **Stripes**: Lower feed rate (f ≈ 0.035, k ≈ 0.060)
- **Mixed Patterns**: Intermediate values

## 🚀 Usage

### Online
Visit the live demo: [https://aiml-1870-2026.github.io/Katterpiller314/turing-explorer/](https://aiml-1870-2026.github.io/Katterpiller314/turing-explorer/)

### Local
Simply open `index.html` in any modern web browser. No build process or server required!

## 🎮 Controls

1. **Select Animal**: Choose from leopard, zebra, giraffe, or cheetah
2. **Adjust Parameters**:
   - **Feed Rate**: Controls how quickly chemical A is replenished (0.01 - 0.1)
   - **Kill Rate**: Controls how quickly chemical B decays (0.03 - 0.08)
3. **Use Presets**: Click preset buttons for classic patterns
4. **Add Chemical**: Click anywhere on the animal to add chemical B
5. **Reset**: Start fresh with a new random seed

## 📊 Understanding the Phase Diagram

The phase space diagram shows three main regions:

- **Yellow (Spots)**: High feed, high kill rates produce spotted patterns
- **Blue (Stripes)**: Low feed, medium kill rates produce striped patterns
- **Purple (Mixed)**: Intermediate values create complex mixed patterns

The red dot shows your current parameter settings.

## 🔬 Educational Value

Turing patterns explain many natural phenomena:
- Animal coat patterns (leopard spots, zebra stripes)
- Seashell pigmentation
- Chemical oscillations
- Cellular organization during development

Alan Turing first proposed this mechanism in his 1952 paper "The Chemical Basis of Morphogenesis."

## 🛠️ Technical Details

- **Canvas Size**: 600×600 pixels
- **Algorithm**: Gray-Scott model with 9-point Laplacian stencil
- **Update Rate**: 10 simulation steps per frame
- **Time Step**: 1.0
- **Diffusion Rates**: dA = 1.0, dB = 0.5

## 📝 License

Created for educational purposes as part of AIML-1870-2026 coursework.

## 🙏 Acknowledgments

- Alan Turing's pioneering work on morphogenesis
- Karl Sims for popularizing reaction-diffusion simulations
- Inspired by natural animal coat patterns

---

**Created with Claude Code** 🤖
