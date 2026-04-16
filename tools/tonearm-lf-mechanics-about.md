---
title: About the Tonearm LF Mechanics Calculator
nav_exclude: true
---

# About the Tonearm LF Mechanics Calculator

This calculator models the low-frequency mechanical behavior of a tonearm-cartridge system. It computes the resonant frequency, damping characteristics, frequency response, transient behavior, and contact force envelope from your cartridge and tonearm specifications.

All outputs have been verified against the original spreadsheet implementation.

---

## Input Fields

### Cartridge Parameters

**VTF** — Your static tracking force in grams. Used as the equilibrium point for the contact force calculations and the trackability simulation.

**Static compliance** — Compliance measured by static deflection, in µm/mN. The calculator converts this to a spring constant: k = 1000 / compliance. This is the primary input for determining resonant frequency.

**Dynamic compliance** — Compliance measured at a specific test frequency, in µm/mN. Because the cantilever's rubber damper adds velocity-dependent stiffness, dynamic compliance is lower than static compliance. The calculator uses the ratio between static and dynamic to derive the cartridge's internal damping.

**at frequency** — The test frequency for the dynamic compliance measurement, in Hz. Enter whatever the manufacturer specifies.

### Tonearm Parameters

**Effective mass** — The tonearm's effective mass in grams, as published in the tonearm spec. Added to the cartridge + fixings mass to get the total system mass.

**Cart + fixings mass** — Total mass of the cartridge body, headshell, screws, and spacers in grams.

**Damping — Manual vs Log Decrement** — Two ways to specify tonearm damping:

- **Manual**: Enter the arm damping ratio directly (dimensionless). Zero means the arm contributes no damping.

- **Log Decrement**: Derive the arm damping from a free-decay measurement. Displace the arm and let it ring. Measure two successive positive peaks of the decaying oscillation — **Peak A** (the larger, earlier peak) and **Peak B** (the next). The calculator extracts the total damping from the decay rate, then subtracts the cartridge's contribution to isolate the arm's damping.

### Trackability

**Frequency** — Test tone frequency in Hz. Default is 315 Hz.

**Amplitude pk-pk** — Peak-to-peak groove modulation of the test tone, in mm. The calculator runs a full time-domain transient simulation at this frequency and amplitude to determine whether the stylus maintains contact.

### Excitation

**Amplitude** — Excitation amplitude in µm, used only for the Contact Force plot. This scales the force envelope around the static VTF.

---

## Output Panels

### Frequency Response

Cantilever deflection relative to groove excitation, plotted from 1–100 Hz on a log scale, in dB. This shows how much the cantilever deflects for a given amount of groove motion at each frequency.

At low frequencies, the arm tracks the groove and the cantilever barely deflects — the curve is well below 0 dB. At resonance, cantilever deflection is amplified well beyond the groove excitation — this is the peak. Above resonance, the curve approaches 0 dB as the arm mass stays increasingly stationary and the cantilever absorbs the full groove motion.

Two reference lines mark the undamped natural frequency f_n and the damped resonant peak f_r. The calculator computes f_r as:

> f_r = f_n × (1 + 1/(2Q)²)

The transfer function is:

> H(dB) = 20 log₁₀ √( (r⁴ + (2·ζ_arm·r)²) / ((1−r²)² + (2·ζ_total·r)²) )

where r = f/f_n and ζ_total = ζ_arm + ζ_cartridge. The numerator contains only the arm damping ratio because in this model the arm damper connects the arm mass to the pivot (a fixed reference), while the cartridge damper connects the arm mass to the groove (the moving base). Because they act against different reference points, they enter the transfer function differently.

### Transient Response

Free-decay response showing how the system rings after a disturbance. The horizontal axis is normalized time (ω_n × t), so the period is always ~2π regardless of resonant frequency.

The waveform is a damped cosine:

> A(t) = e^(−ζ·t) × cos(√(1−ζ²) × t)

where ζ is the overall damping ratio. At ζ = 1 the system is critically damped (no oscillation). At ζ < 1 the system oscillates with exponentially decaying amplitude. Lower ζ means more ringing; higher ζ means faster decay.

### Contact Force

Shows how the tonearm-cartridge resonance modulates the contact force around the static VTF. The excitation amplitude input provides a scaling factor to give the plot real units.

The **upper and lower envelopes** show peak and minimum contact force at each frequency. At resonance, the force swings are largest. If the lower envelope hits zero, the stylus lifts off.

The **relative wear** curve (purple, right axis) uses a Hertzian contact model: wear ∝ force^1.5. A value of 1.0 means no extra wear versus a flat record. At resonance, the force peaks cause disproportionate wear even though the time-averaged force is unchanged — the nonlinear force-wear relationship penalizes the peaks more than the troughs help.

### Resonance

- **Total effective mass**: Arm effective mass + cartridge + fixings.
- **Natural frequency (undamped)**: f_n = √(k/m) / (2π). This is where the system would resonate with zero damping.
- **Resonant peak frequency**: Where the actual peak falls, computed from f_n and overall Q.
- **Resonant peak**: Peak height in dB.

### Damping

- **Cartridge damping ratio (ζ_c)**: Derived from the static/dynamic compliance ratio. Represents internal losses in the cantilever suspension.
- **Cartridge Q**: 1/(2·ζ_c).
- **Arm Q**: 1/(2·ζ_arm).
- **Overall Q**: 1 / (2 × (ζ_arm + ζ_cartridge)). Critically damped at Q = 0.5 (ζ = 1).
- **Damping coefficient**: Absolute damping in Ns/m.
- **Calculated arm damping** (Log Decrement mode only): The damping ratio extracted from your Peak A/B measurement.

### Trackability

- **Min VTF required**: Minimum tracking force to maintain groove contact at the specified modulation. Comes from a full transient simulation — the worst case occurs during the first few cycles before steady state, so this is always higher than what steady-state analysis would predict.

- **Velocity (rms)**: The rms groove velocity of the test signal in cm/s: v_rms = (2π × f × A_half) / √2. Lets you compare against published trackability specs.

- **RIAA level**: Equivalent recorded level in dB, referenced to 5.6 cm/s rms at 1 kHz. Applies RIAA pre-emphasis so you can relate the test signal to typical levels on commercial pressings.

---

## The Physical Model

The tonearm-cartridge is modeled as a single-degree-of-freedom mass-spring-damper system with base excitation (the groove).

- **Mass**: total effective mass (arm + cartridge + fixings)
- **Spring**: cantilever compliance (connects arm mass to groove)
- **Damper**: two components — the cartridge's internal suspension damping (connects arm mass to groove, in parallel with the spring) and the arm's damping (connects arm mass to the pivot). Because these two dampers act against different reference points — the groove and the pivot respectively — they enter the equations of motion differently.

This model is valid where the arm behaves as a rigid body. Arm tube resonances and headshell modes are outside the scope of this calculator.

### How cartridge damping is derived

Manufacturers rarely publish damping. The calculator infers it from the static-to-dynamic compliance relationship.

The cantilever suspension is a spring with a parallel damper (both connecting the stylus to the arm). At a given frequency, the damper's velocity-dependent force makes the system appear stiffer than the static spring alone. The amount of additional stiffness at the test frequency reveals the damping:

> ζ_cartridge = (k × √((Z/k)² − 1)) / (2π × f_test × c_critical)

where Z = 1000 / dynamic_compliance is the dynamic stiffness and c_critical = 2·m·ω_n.

### The time-domain simulation

The trackability section uses a full transient simulation rather than just steady-state frequency response. This matters because the worst-case contact force occurs during startup — the arm is at rest when a modulated groove begins, and the transient overshoot during the first few cycles produces higher peak forces than the eventual steady state.

The simulation solves the equation of motion analytically as the sum of a particular solution (steady-state forced response) and a homogeneous solution (transient decay). Contact force at each timestep includes both the spring force from cantilever deflection and the damping force from cantilever velocity.

---

## Source

All formulas have been extracted from the original spreadsheet implementation and verified to match its outputs.
