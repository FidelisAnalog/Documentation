"use strict";
(function () {
  var h = React.createElement;
  var useState = React.useState;
  var useRef = React.useRef;
  var useEffect = React.useEffect;
  var useCallback = React.useCallback;

  var C = {
    sig1: "#00e5ff", sig2: "#ff2d7b", sig3: "#ffc400",
    composite: "#ffffff",
    grid: "rgba(255,255,255,0.06)", gridMajor: "rgba(255,255,255,0.12)",
    panelBg: "#0f1319", border: "rgba(255,255,255,0.08)",
    text: "rgba(255,255,255,0.7)", dim: "rgba(255,255,255,0.35)",
  };

  var DEFAULTS = [
    { freq: 220, amp: 0.8, label: "Signal A", color: C.sig1 },
    { freq: 660, amp: 0.5, label: "Signal B", color: C.sig2 },
    { freq: 1540, amp: 0.3, label: "Signal C", color: C.sig3 },
  ];

  var MASTER_VOL = 0.25;

  function drawGrid(ctx, w, ht) {
    var div = 10, sub = 5, i, x, y;
    ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
    for (i = 0; i <= div * sub; i++) {
      x = (w / (div * sub)) * i;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ht); ctx.stroke();
    }
    for (i = 0; i <= 8 * sub; i++) {
      y = (ht / (8 * sub)) * i;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
    ctx.strokeStyle = C.gridMajor; ctx.lineWidth = 1;
    for (i = 0; i <= div; i++) {
      x = (w / div) * i;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ht); ctx.stroke();
    }
    for (i = 0; i <= 8; i++) {
      y = (ht / 8) * i;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
    ctx.strokeStyle = "rgba(255,255,255,0.18)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, ht / 2); ctx.lineTo(w, ht / 2); ctx.stroke();
  }

  function drawWaveform(ctx, w, ht, pts, color, lw, glow) {
    if (glow) { ctx.shadowColor = color; ctx.shadowBlur = 12; }
    ctx.strokeStyle = color; ctx.lineWidth = lw;
    ctx.lineJoin = "round"; ctx.lineCap = "round";
    ctx.beginPath();
    for (var i = 0; i < pts.length; i++) {
      var x = (i / (pts.length - 1)) * w;
      var y = ht / 2 - pts[i] * (ht / 2) * 0.85;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke(); ctx.shadowBlur = 0;
  }

  function genSine(freq, amp, n, tw) {
    var pts = [];
    for (var i = 0; i < n; i++) {
      pts.push(amp * Math.sin(2 * Math.PI * freq * (i / (n - 1)) * tw));
    }
    return pts;
  }

  function WaveformCanvas(props) {
    var signals = props.signals, showInd = props.showIndividual,
        comp = props.compositeOnly, ht = props.height || 180;
    var canvasRef = useRef(null), boxRef = useRef(null);

    var draw = useCallback(function () {
      var cv = canvasRef.current, box = boxRef.current;
      if (!cv || !box) return;
      var r = box.getBoundingClientRect();
      var dpr = window.devicePixelRatio || 1, w = r.width;
      cv.width = w * dpr; cv.height = ht * dpr;
      cv.style.width = w + "px"; cv.style.height = ht + "px";
      var ctx = cv.getContext("2d");
      ctx.scale(dpr, dpr); ctx.clearRect(0, 0, w, ht);
      drawGrid(ctx, w, ht);
      var ns = Math.max(800, Math.round(w * 2)), tw = 0.01;

      if (comp) {
        if (showInd) {
          signals.forEach(function (s) {
            if (!s.visible) return;
            drawWaveform(ctx, w, ht, genSine(s.freq, s.amp, ns, tw), s.color + "40", 1.5, false);
          });
        }
        var sum = new Array(ns).fill(0);
        signals.forEach(function (s) {
          if (!s.visible) return;
          var p = genSine(s.freq, s.amp, ns, tw);
          for (var i = 0; i < ns; i++) sum[i] += p[i];
        });
        var mv = Math.max.apply(null, sum.map(Math.abs).concat([0.001]));
        var sc = mv > 1 ? 1 / mv : 1;
        drawWaveform(ctx, w, ht, sum.map(function (v) { return v * sc; }), C.composite, 2.5, true);
      } else {
        var s = signals[0];
        drawWaveform(ctx, w, ht, genSine(s.freq, s.amp, ns, tw), s.color, 2.5, true);
      }
    }, [signals, showInd, comp, ht]);

    useEffect(function () {
      draw();
      window.addEventListener("resize", draw);
      return function () { window.removeEventListener("resize", draw); };
    }, [draw]);

    return h("div", { ref: boxRef, style: { width: "100%", position: "relative" } },
      h("canvas", { ref: canvasRef })
    );
  }

  function Slider(props) {
    var v = props.value;
    var txt = (v >= 1000 ? (v / 1000).toFixed(1) + " k" : v.toFixed(props.step < 1 ? 1 : 0)) + " " + props.unit;
    return h("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 3 } },
      h("span", { style: { fontSize: 10, color: C.dim, width: 28, textAlign: "right", flexShrink: 0 } }, props.label),
      h("input", { type: "range", min: props.min, max: props.max, step: props.step, value: v, onChange: function (e) { props.onChange(parseFloat(e.target.value)); }, style: { color: props.color } }),
      h("span", { style: { fontSize: 11, color: C.text, width: 64, textAlign: "right", flexShrink: 0 } }, txt)
    );
  }

  function SignalPanel(props) {
    var s = props.signal, i = props.index, onChange = props.onChange;
    var fl = s.freq >= 1000 ? (s.freq / 1000).toFixed(s.freq % 1000 === 0 ? 0 : 1) + " kHz" : s.freq + " Hz";
    return h("div", { className: "sd-panel" },
      h("div", { style: { display: "flex", alignItems: "center", gap: 8 } },
        h("div", { style: { width: 8, height: 8, borderRadius: "50%", background: s.color, boxShadow: "0 0 6px " + s.color + "60", flexShrink: 0 } }),
        h("span", { style: { fontSize: 12, fontWeight: 600, color: s.color, letterSpacing: "0.04em" } }, s.label),
        h("span", { style: { marginLeft: "auto", fontSize: 10, color: C.dim } }, fl)
      ),
      h(WaveformCanvas, { signals: [s], height: 56 }),
      h("div", null,
        h(Slider, { label: "freq", value: s.freq, min: 50, max: 5000, step: 10, unit: "Hz", color: s.color, onChange: function (v) { onChange(i, "freq", v); } }),
        h(Slider, { label: "amp", value: s.amp, min: 0, max: 1, step: 0.05, unit: "", color: s.color, onChange: function (v) { onChange(i, "amp", v); } })
      )
    );
  }

  // Play button SVG icons
  function PlayIcon() {
    return h("svg", { width: 14, height: 14, viewBox: "0 0 24 24", fill: "currentColor", style: { display: "block" } },
      h("polygon", { points: "6,3 20,12 6,21" })
    );
  }
  function StopIcon() {
    return h("svg", { width: 14, height: 14, viewBox: "0 0 24 24", fill: "currentColor", style: { display: "block" } },
      h("rect", { x: 5, y: 5, width: 14, height: 14, rx: 1.5 })
    );
  }

  function App() {
    var st = useState(DEFAULTS.map(function (d) { return Object.assign({}, d, { visible: true }); }));
    var signals = st[0], setSignals = st[1];
    var tr = useState(true);
    var showTraces = tr[0], setShowTraces = tr[1];
    var pl = useState(false);
    var playing = pl[0], setPlaying = pl[1];

    // Audio engine ref - persists across renders
    var audioRef = useRef(null);

    // Initialize audio context and oscillators on first play
    function initAudio(sigs) {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      var master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);

      var oscillators = [];
      var gains = [];

      sigs.forEach(function (sig) {
        var osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = sig.freq;

        var gain = ctx.createGain();
        gain.gain.value = sig.visible ? sig.amp : 0;

        osc.connect(gain);
        gain.connect(master);
        osc.start();

        oscillators.push(osc);
        gains.push(gain);
      });

      audioRef.current = { ctx: ctx, oscillators: oscillators, gains: gains, master: master };
    }

    function togglePlay() {
      if (!audioRef.current) {
        initAudio(signals);
      }
      var a = audioRef.current;
      // Resume context if suspended (browser autoplay policy)
      if (a.ctx.state === "suspended") {
        a.ctx.resume();
      }
      if (!playing) {
        // Fade in
        a.master.gain.cancelScheduledValues(a.ctx.currentTime);
        a.master.gain.setTargetAtTime(MASTER_VOL, a.ctx.currentTime, 0.03);
        setPlaying(true);
      } else {
        // Fade out
        a.master.gain.cancelScheduledValues(a.ctx.currentTime);
        a.master.gain.setTargetAtTime(0, a.ctx.currentTime, 0.03);
        setPlaying(false);
      }
    }

    // Sync oscillator params with signal state in real time
    useEffect(function () {
      var a = audioRef.current;
      if (!a) return;
      var t = a.ctx.currentTime;
      signals.forEach(function (sig, i) {
        a.oscillators[i].frequency.setTargetAtTime(sig.freq, t, 0.02);
        a.gains[i].gain.setTargetAtTime(sig.visible ? sig.amp : 0, t, 0.02);
      });
    }, [signals]);

    // Cleanup on unmount
    useEffect(function () {
      return function () {
        if (audioRef.current) {
          audioRef.current.ctx.close();
          audioRef.current = null;
        }
      };
    }, []);

    var handleChange = function (idx, key, val) {
      setSignals(function (prev) {
        var next = prev.slice();
        next[idx] = Object.assign({}, next[idx]);
        next[idx][key] = val;
        return next;
      });
    };

    var toggleVis = function (idx) {
      setSignals(function (prev) {
        var next = prev.slice();
        next[idx] = Object.assign({}, next[idx], { visible: !next[idx].visible });
        return next;
      });
    };

    var btnBase = { borderRadius: 5, cursor: "pointer", display: "flex", alignItems: "center" };

    return h("div", null,

      // === STICKY COMPOSITE ===
      h("div", { className: "sd-composite" },

        // Header + controls
        h("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 } },
          h("div", { style: { display: "flex", alignItems: "center", gap: 10 } },
            h("h1", { style: { fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 17, fontWeight: 400, color: "#fff", margin: 0 } }, "Composite Signal"),
            h("span", { style: { fontSize: 10, color: C.dim, fontFamily: "'IBM Plex Sans', sans-serif" } }, "A + B + C"),

            // Play/Stop button
            h("button", {
              onClick: togglePlay,
              title: playing ? "Stop audio" : "Play composite signal",
              style: Object.assign({}, btnBase, {
                background: playing ? "rgba(255,255,255,0.12)" : "transparent",
                border: "1px solid " + (playing ? "rgba(255,255,255,0.25)" : C.border),
                padding: "4px 10px",
                gap: 5,
                color: playing ? "#fff" : C.dim,
                marginLeft: 4,
              })
            },
              playing ? h(StopIcon) : h(PlayIcon),
              h("span", { style: { fontSize: 10 } }, playing ? "Stop" : "Play")
            )
          ),
          h("div", { style: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" } },
            h("button", {
              onClick: function () { setShowTraces(!showTraces); },
              style: Object.assign({}, btnBase, { background: showTraces ? "rgba(255,255,255,0.08)" : "transparent", border: "1px solid " + (showTraces ? "rgba(255,255,255,0.2)" : C.border), padding: "4px 9px", fontSize: 10, color: showTraces ? C.text : C.dim, gap: 4 })
            }, (showTraces ? "\u2611" : "\u2610") + " Sources"),
            signals.map(function (sig, i) {
              return h("button", {
                key: i, onClick: function () { toggleVis(i); },
                style: Object.assign({}, btnBase, { background: sig.visible ? sig.color + "18" : "transparent", border: "1px solid " + (sig.visible ? sig.color + "50" : C.border), padding: "4px 7px", gap: 4 })
              },
                h("div", { style: { width: 7, height: 7, borderRadius: "50%", background: sig.visible ? sig.color : "transparent", border: "1.5px solid " + sig.color } }),
                h("span", { style: { fontSize: 10, color: sig.visible ? sig.color : C.dim } }, sig.label.split(" ")[1])
              );
            })
          )
        ),

        // Waveform
        h("div", { className: "sd-composite-inner" },
          h(WaveformCanvas, { signals: signals, showIndividual: showTraces, compositeOnly: true, height: 180 }),
          h("div", { style: { marginTop: 6, textAlign: "center", fontSize: 9, color: C.dim } },
            "10 ms window  \u00B7  horizontal: time \u2192   vertical: amplitude"
          )
        )
      ),

      // === SOURCE SIGNALS ===
      h("div", { className: "sd-sources" },

        // Separator
        h("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "12px 0 10px" } },
          h("div", { style: { height: 1, flex: 1, maxWidth: 80, background: "linear-gradient(to right, transparent, rgba(255,255,255,0.15))" } }),
          h("span", { style: { fontSize: 9, color: C.dim, textTransform: "uppercase", letterSpacing: "0.15em", fontFamily: "'IBM Plex Sans', sans-serif" } }, "Source Signals"),
          h("div", { style: { height: 1, flex: 1, maxWidth: 80, background: "linear-gradient(to left, transparent, rgba(255,255,255,0.15))" } })
        ),

        // Panels - single column
        signals.map(function (sig, i) {
          return h(SignalPanel, { key: i, signal: sig, index: i, onChange: handleChange });
        }),

        // Explanation
        h("div", { className: "sd-explanation" },
          h("p", null,
            "An analog audio signal is a continuously varying electrical voltage. When multiple sound sources exist simultaneously, their voltages add together at every instant in time \u2014 this is ",
            h("span", { style: { color: "#fff" } }, "superposition"),
            ". The composite waveform above is the point-by-point sum of all three source signals. A loudspeaker\u2019s diaphragm follows this single composite voltage to reproduce the original sounds."
          )
        )
      )
    );
  }

  var root = document.getElementById("signal-demo");
  if (root) {
    ReactDOM.createRoot(root).render(h(App));
  }
})();
