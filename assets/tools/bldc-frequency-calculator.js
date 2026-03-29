"use strict";
(function () {
  var h = React.createElement;
  var useState = React.useState;
  var useMemo = React.useMemo;

  // ============================================================
  // THEME / COLORS
  // ============================================================
  var C = {
    cogging: "#ff2d7b",
    torque: "#00e5ff",
    slot: "#ffc400",
    pole: "#a855f7",
    electrical: "#22c55e",
    mechanical: "#f97316",
    text: "rgba(255,255,255,0.7)",
    dim: "rgba(255,255,255,0.35)",
    panelBg: "#0f1319",
    border: "rgba(255,255,255,0.08)",
  };

  // ============================================================
  // CALCULATION ENGINE
  // ============================================================
  function gcd(a, b) {
    a = Math.abs(Math.round(a));
    b = Math.abs(Math.round(b));
    while (b) { var t = b; b = a % b; a = t; }
    return a;
  }

  function lcm(a, b) {
    return Math.abs(Math.round(a) * Math.round(b)) / gcd(a, b);
  }

  function calcFrequencies(params) {
    var poles = params.poles;
    var slots = params.slots;
    var rpm = params.rpm;
    var phases = params.phases;
    var driveType = params.driveType;

    var mechFreq = rpm / 60;
    var polePairs = poles / 2;
    var elecFreq = polePairs * mechFreq;
    var lcmVal = lcm(poles, slots);

    // Fundamentals
    var fundamentals = {
      mechanical: mechFreq,
      electrical: elecFreq,
      polePairs: polePairs,
      lcm: lcmVal,
    };

    // Geometry
    var geometry = {
      polePitch: 360 / poles,
      slotPitch: 360 / slots,
      coggingPitch: 360 / lcmVal,
    };

    // Cogging
    var cogging = {
      frequency: lcmVal * mechFreq,
    };

    // Torque ripple - based on phase count and drive type
    var torqueRipple = [];
    var baseMultiplier = phases; // 2× for 2-phase, 3× for 3-phase

    // Full-wave: phase-count harmonics
    for (var i = 1; i <= 4; i++) {
      torqueRipple.push({
        multiplier: i * baseMultiplier,
        frequency: i * baseMultiplier * elecFreq,
        source: "full-wave",
      });
    }

    // Half-wave adds even electrical harmonics
    if (driveType === "half") {
      var evenHarmonics = [2, 4, 6, 8];
      evenHarmonics.forEach(function (m) {
        // Check if not already covered by phase harmonics
        var exists = torqueRipple.some(function (t) { return t.multiplier === m; });
        if (!exists) {
          torqueRipple.push({
            multiplier: m,
            frequency: m * elecFreq,
            source: "half-wave",
          });
        }
      });
      // Sort by multiplier
      torqueRipple.sort(function (a, b) { return a.multiplier - b.multiplier; });
    }

    // Slot/Coil harmonics - up to 55 Hz or 10×, whichever is more useful
    var slotHarmonics = [];
    var slotFundamental = slots * mechFreq;
    for (var i = 1; i <= 10; i++) {
      var freq = i * slotFundamental;
      if (freq <= 100 || i <= 4) { // Show at least 4, or up to 100 Hz
        slotHarmonics.push({ multiplier: i, frequency: freq });
      }
    }

    // Pole harmonics
    var poleHarmonics = [];
    var poleFundamental = poles * mechFreq;
    for (var i = 1; i <= 10; i++) {
      var freq = i * poleFundamental;
      if (freq <= 100 || i <= 4) {
        poleHarmonics.push({ multiplier: i, frequency: freq });
      }
    }

    // Electrical harmonics
    var electricalHarmonics = [];
    for (var i = 1; i <= 10; i++) {
      electricalHarmonics.push({ multiplier: i, frequency: i * elecFreq });
    }

    // Mechanical harmonics - up to ~55 Hz
    var mechanicalHarmonics = [];
    var maxMechHarmonic = Math.ceil(55 / mechFreq);
    for (var i = 1; i <= Math.min(maxMechHarmonic, 100); i++) {
      mechanicalHarmonics.push({ multiplier: i, frequency: i * mechFreq });
    }

    return {
      fundamentals: fundamentals,
      geometry: geometry,
      cogging: cogging,
      torqueRipple: torqueRipple,
      slotHarmonics: slotHarmonics,
      poleHarmonics: poleHarmonics,
      electricalHarmonics: electricalHarmonics,
      mechanicalHarmonics: mechanicalHarmonics,
    };
  }

  // ============================================================
  // FORMATTING HELPERS
  // ============================================================
  function formatFreq(hz) {
    if (hz >= 1000) {
      return (hz / 1000).toFixed(2) + " kHz";
    } else if (hz >= 100) {
      return hz.toFixed(1) + " Hz";
    } else if (hz >= 10) {
      return hz.toFixed(2) + " Hz";
    } else {
      return hz.toFixed(3) + " Hz";
    }
  }

  function formatDegrees(deg) {
    return deg.toFixed(2) + "°";
  }

  // ============================================================
  // UI COMPONENTS
  // ============================================================

  // Input text box with label
  function InputNumber(props) {
    var label = props.label;
    var value = props.value;
    var onChange = props.onChange;
    var min = props.min;
    var max = props.max;
    var step = props.step || 1;

    return h("div", { className: "bc-input-row" },
      h("label", { className: "bc-input-label" }, label),
      h("input", {
        type: "number",
        min: min,
        max: max,
        step: step,
        value: value,
        onChange: function (e) {
          var val = parseFloat(e.target.value);
          if (!isNaN(val)) onChange(val);
        },
        className: "bc-number-input",
      })
    );
  }

  // Input slider with label and value display
  function InputSlider(props) {
    var label = props.label;
    var value = props.value;
    var min = props.min;
    var max = props.max;
    var step = props.step;
    var onChange = props.onChange;
    var unit = props.unit || "";

    return h("div", { className: "bc-input-row" },
      h("label", { className: "bc-input-label" }, label),
      h("input", {
        type: "range",
        min: min,
        max: max,
        step: step,
        value: value,
        onChange: function (e) { onChange(parseFloat(e.target.value)); },
        className: "bc-slider",
      }),
      h("span", { className: "bc-input-value" }, value + " " + unit)
    );
  }

  // Toggle button group
  function ToggleGroup(props) {
    var label = props.label;
    var options = props.options;
    var value = props.value;
    var onChange = props.onChange;

    return h("div", { className: "bc-toggle-row" },
      h("label", { className: "bc-input-label" }, label),
      h("div", { className: "bc-toggle-group" },
        options.map(function (opt) {
          var isActive = opt.value === value;
          return h("button", {
            key: opt.value,
            className: "bc-toggle-btn" + (isActive ? " bc-toggle-active" : ""),
            onClick: function () { onChange(opt.value); },
          }, opt.label);
        })
      )
    );
  }

  // Frequency row within a panel
  function FreqRow(props) {
    var label = props.label;
    var frequency = props.frequency;
    var note = props.note;
    var color = props.color;

    return h("div", { className: "bc-freq-row" },
      h("span", { className: "bc-freq-label", style: { color: color || C.text } }, label),
      h("span", { className: "bc-freq-value" }, formatFreq(frequency)),
      note ? h("span", { className: "bc-freq-note" }, note) : null
    );
  }

  // Panel wrapper
  function Panel(props) {
    var title = props.title;
    var color = props.color;
    var children = props.children;
    var collapsed = props.collapsed;
    var onToggle = props.onToggle;

    return h("div", { className: "bc-panel" },
      h("div", {
        className: "bc-panel-header",
        onClick: onToggle,
        style: { cursor: onToggle ? "pointer" : "default" },
      },
        h("div", { className: "bc-panel-dot", style: { background: color } }),
        h("span", { className: "bc-panel-title" }, title),
        onToggle ? h("span", { className: "bc-panel-chevron" }, collapsed ? "▶" : "▼") : null
      ),
      !collapsed ? h("div", { className: "bc-panel-content" }, children) : null
    );
  }

  // Info row (for non-frequency data like geometry)
  function InfoRow(props) {
    return h("div", { className: "bc-info-row" },
      h("span", { className: "bc-info-label" }, props.label),
      h("span", { className: "bc-info-value" }, props.value)
    );
  }

  // ============================================================
  // MAIN APP
  // ============================================================
  function App() {
    // Input state
    var poleState = useState(20);
    var poles = poleState[0], setPoles = poleState[1];

    var slotState = useState(15);
    var slots = slotState[0], setSlots = slotState[1];

    var rpmState = useState(33.333);
    var rpm = rpmState[0], setRpm = rpmState[1];

    var phaseState = useState(3);
    var phases = phaseState[0], setPhases = phaseState[1];

    var driveState = useState("full");
    var driveType = driveState[0], setDriveType = driveState[1];

    var corelessState = useState(false);
    var coreless = corelessState[0], setCoreless = corelessState[1];

    // Panel collapse state - all expanded by default except mechanical
    var collapsedState = useState({
      fundamentals: false,
      geometry: false,
      cogging: false,
      torque: false,
      slot: false,
      pole: false,
      electrical: false,
      mechanical: true
    });
    var collapsed = collapsedState[0], setCollapsed = collapsedState[1];

    function togglePanel(id) {
      setCollapsed(function(prev) {
        var next = Object.assign({}, prev);
        next[id] = !next[id];
        return next;
      });
    }

    // Calculate all frequencies
    var data = useMemo(function () {
      return calcFrequencies({
        poles: poles,
        slots: slots,
        rpm: rpm,
        phases: phases,
        driveType: driveType,
      });
    }, [poles, slots, rpm, phases, driveType]);

    return h("div", null,

      // === TITLE ===
      h("h1", { className: "bc-title" }, "BLDC Motor Frequency Calculator"),

      // === INPUT SECTION ===
      h("div", { className: "bc-inputs" },
        h("div", { className: "bc-inputs-title" }, "Motor Parameters"),

        h(InputNumber, {
          label: "Poles",
          value: poles,
          min: 2,
          max: 200,
          step: 2,
          onChange: setPoles,
        }),

        h(InputNumber, {
          label: "Slots/Coils",
          value: slots,
          min: 3,
          max: 200,
          step: 1,
          onChange: setSlots,
        }),

        h(ToggleGroup, {
          label: "RPM",
          options: [
            { value: 16.667, label: "16⅔" },
            { value: 22.5, label: "22½" },
            { value: 33.333, label: "33⅓" },
            { value: 45, label: "45" },
            { value: 78, label: "78" },
          ],
          value: rpm,
          onChange: setRpm,
        }),

        h(ToggleGroup, {
          label: "Phases",
          options: [
            { value: 2, label: "2-phase" },
            { value: 3, label: "3-phase" },
          ],
          value: phases,
          onChange: setPhases,
        }),

        h(ToggleGroup, {
          label: "Drive",
          options: [
            { value: "full", label: "Full-wave" },
            { value: "half", label: "Half-wave" },
          ],
          value: driveType,
          onChange: setDriveType,
        }),

        h(ToggleGroup, {
          label: "Motor",
          options: [
            { value: false, label: "Cored" },
            { value: true, label: "Coreless/Slotless" },
          ],
          value: coreless,
          onChange: setCoreless,
        })
      ),

      // === OUTPUT PANELS ===
      h("div", { className: "bc-outputs" },

        // Fundamentals
        h(Panel, {
          title: "Fundamentals",
          color: C.text,
          collapsed: collapsed.fundamentals,
          onToggle: function() { togglePanel("fundamentals"); }
        },
          h(InfoRow, { label: "Mechanical freq", value: formatFreq(data.fundamentals.mechanical) }),
          h(InfoRow, { label: "Electrical freq", value: formatFreq(data.fundamentals.electrical) }),
          h(InfoRow, { label: "Pole pairs", value: data.fundamentals.polePairs }),
          h(InfoRow, { label: "LCM(poles, slots)", value: data.fundamentals.lcm })
        ),

        // Geometry
        h(Panel, {
          title: "Geometry",
          color: C.dim,
          collapsed: collapsed.geometry,
          onToggle: function() { togglePanel("geometry"); }
        },
          h(InfoRow, { label: "Pole pitch", value: formatDegrees(data.geometry.polePitch) }),
          h(InfoRow, { label: "Slot pitch", value: formatDegrees(data.geometry.slotPitch) }),
          h(InfoRow, { label: "Cogging pitch", value: formatDegrees(data.geometry.coggingPitch) })
        ),

        // Cogging (hide if coreless)
        !coreless ? h(Panel, {
          title: "Cogging",
          color: C.cogging,
          collapsed: collapsed.cogging,
          onToggle: function() { togglePanel("cogging"); }
        },
          h(FreqRow, {
            label: "LCM × mechanical",
            frequency: data.cogging.frequency,
            color: C.cogging,
          })
        ) : null,

        // Torque Ripple
        h(Panel, {
          title: "Torque Ripple",
          color: C.torque,
          collapsed: collapsed.torque,
          onToggle: function() { togglePanel("torque"); }
        },
          data.torqueRipple.map(function (t, i) {
            return h(FreqRow, {
              key: i,
              label: t.multiplier + "× electrical",
              frequency: t.frequency,
              note: t.source === "half-wave" ? "(half-wave)" : null,
              color: C.torque,
            });
          })
        ),

        // Slot/Coil Harmonics
        h(Panel, {
          title: "Slot/Coil Harmonics",
          color: C.slot,
          collapsed: collapsed.slot,
          onToggle: function() { togglePanel("slot"); }
        },
          data.slotHarmonics.map(function (s, i) {
            return h(FreqRow, {
              key: i,
              label: s.multiplier + "× slot",
              frequency: s.frequency,
              color: C.slot,
            });
          })
        ),

        // Pole Harmonics
        h(Panel, {
          title: "Pole Harmonics",
          color: C.pole,
          collapsed: collapsed.pole,
          onToggle: function() { togglePanel("pole"); }
        },
          data.poleHarmonics.map(function (p, i) {
            return h(FreqRow, {
              key: i,
              label: p.multiplier + "× pole",
              frequency: p.frequency,
              color: C.pole,
            });
          })
        ),

        // Electrical Harmonics
        h(Panel, {
          title: "Electrical Harmonics",
          color: C.electrical,
          collapsed: collapsed.electrical,
          onToggle: function() { togglePanel("electrical"); }
        },
          data.electricalHarmonics.map(function (e, i) {
            return h(FreqRow, {
              key: i,
              label: e.multiplier + "× electrical",
              frequency: e.frequency,
              color: C.electrical,
            });
          })
        ),

        // Mechanical Harmonics (collapsed by default)
        h(Panel, {
          title: "Mechanical Harmonics (" + data.mechanicalHarmonics.length + ")",
          color: C.mechanical,
          collapsed: collapsed.mechanical,
          onToggle: function() { togglePanel("mechanical"); }
        },
          data.mechanicalHarmonics.map(function (m, i) {
            return h(FreqRow, {
              key: i,
              label: m.multiplier + "× mechanical",
              frequency: m.frequency,
              color: C.mechanical,
            });
          })
        )
      )
    );
  }

  // Mount
  var root = document.getElementById("bldc-calc");
  if (root) {
    ReactDOM.createRoot(root).render(h(App));
  }
})();
