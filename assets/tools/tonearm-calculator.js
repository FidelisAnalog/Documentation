"use strict";
(function () {
  var h = React.createElement;
  var useState = React.useState;
  var useMemo = React.useMemo;
  var useEffect = React.useEffect;
  var useRef = React.useRef;

  var PI = Math.PI;

  // ============================================================
  // PHYSICS ENGINE — exact replication of Luckydog spreadsheet
  // ============================================================

  function calculate(params) {
    var vtf = params.vtf;                    // grams (H3)
    var compliance = params.staticComp;      // um/mN (H4)
    var dcomp = params.dynamicComp;          // um/mN (H5)
    var dfreq = params.compFreq;             // Hz (H6)
    var tmass = params.armMass;              // grams (H7)
    var cartMass = params.cartMass;          // grams (H8)
    var armDampingInput = params.armDamping; // ratio (H12)
    var mfreq = params.modFreq;             // Hz (H10)
    var modAmplitude = params.modAmplitude;  // mm pk-pk (H11)
    var peakA = params.peakA;               // (E11)
    var peakB = params.peakB;               // (E12)
    var dampingCalcOn = params.dampingCalcOn; // ON/OFF (E8)
    var vtfMaxFreq = params.vtfMaxFreq || 100; // Hz, upper freq for VTF plot

    // RIAA time constants (A6-A8)
    var tc1 = 75e-6;    // 75 us
    var tc2 = 318e-6;   // 318 us
    var tc3 = 3180e-6;  // 3180 us

    // Named range calculations
    var m = (tmass + cartMass) / 1000;            // J17: mass in kg
    var k = 1000 / compliance;                     // J18: spring constant N/m
    var wn = Math.sqrt(k / m);                     // C18: natural freq rad/s
    var cc = 2 * m * wn;                           // M17: critical damping coeff
    var AE = modAmplitude / (2 * 1000);            // P17: half pk-pk in meters
    var Z = 1000 / dcomp;                          // P18: dynamic stiffness
    var f = mfreq;                                 // G17
    var w = 2 * PI * f;                            // G18

    // Cartridge damping ratio (O4)
    var Tc;
    if (dcomp === 0) {
      Tc = 0.05;
    } else if (dfreq > 10000) {
      Tc = 0.2;
    } else {
      Tc = (k * Math.sqrt(Math.pow(Z / k, 2) - 1)) / (2 * PI * dfreq) / cc;
    }

    var cartQ = 1 / (2 * Tc);                     // O5

    // Calculated tonearm damping from log decrement (H13)
    var calcArmDamping = 0;
    if (dampingCalcOn && peakA > 0 && peakB > 0 && peakA > peakB) {
      var logDecRatio = (2 * PI) / Math.log(peakA / peakB);
      calcArmDamping = 1 / Math.sqrt(1 + logDecRatio * logDecRatio) - Tc;
      if (calcArmDamping < 0) calcArmDamping = 0;
    }

    // Effective arm damping: calculated if ON, input if OFF
    var Ta = dampingCalcOn ? calcArmDamping : armDampingInput;  // Sheet3!D2

    // Damping coefficient (J12)
    var dampingCoeff = (dampingCalcOn ? calcArmDamping : armDampingInput) * 2 * m * wn;

    // Arm Q (M12)
    var armQ = dampingCalcOn ? 1 / (calcArmDamping * 2) : 1 / (armDampingInput * 2);

    // Overall damping ratio (N13)
    var overallDamping = Tc + Ta;

    // Overall Q (O12)
    var overallQ = 1 / (2 * overallDamping);

    // T = cartridge damping factor * cc / m (M19)
    var T = Tc * cc / m;  // Note: this is 2*Tc*wn

    // Resonant frequency (N7): (1 + (1/(2*Q))^2) * sqrt(k/m) / (2*pi)
    var fRes = (1 + Math.pow(1 / (2 * overallQ), 2)) * Math.sqrt(k / m) / (2 * PI);

    // Min VTF required (N9) — derived from transient peak
    // Computed after transient simulation below

    // Velocity rms (N11): (2*pi*mfreq) * (modAmplitude/(2*10)) / sqrt(2)
    var velocityRms = (2 * PI * mfreq) * (modAmplitude / (2 * 10)) / Math.sqrt(2);

    // RIAA level (L11)
    var riaaLevel = 20 * Math.log10(velocityRms / 5.6)
      - (10 * Math.log10(1 + 4 * PI * PI * mfreq * mfreq * tc1 * tc1)
       - 10 * Math.log10(1 + 1 / (4 * PI * PI * mfreq * mfreq * tc2 * tc2))
       + 10 * Math.log10(1 + 1 / (4 * PI * PI * tc3 * tc3 * mfreq * mfreq)));

    // ============================================================
    // FREQUENCY RESPONSE (Sheet3 D column)
    // Transmissibility: 20*log(sqrt((r^4 + (2*Ta*r)^2) / ((1-r^2)^2 + (2*(Ta+Tc)*r)^2)))
    // where r = w/wn (using angular frequency w = 2*pi*f)
    // ============================================================
    var freqResponse = [];
    var numFreqPoints = 400;

    for (var i = 0; i < numFreqPoints; i++) {
      var ff = Math.pow(10, Math.log10(1) + (Math.log10(10000) - Math.log10(1)) * i / (numFreqPoints - 1));
      var ww = 2 * PI * ff;
      var rr = ww / wn;  // frequency ratio using angular freq
      var rr2 = rr * rr;
      var rr4 = rr2 * rr2;
      var num = rr4 + Math.pow(2 * Ta * rr, 2);
      var den = Math.pow(1 - rr2, 2) + Math.pow(2 * (Ta + Tc) * rr, 2);
      var Hlin = Math.sqrt(num / den);
      var HdB = 20 * Math.log10(Hlin);
      // Base-excited force transmissibility: sqrt((1 + (2*zeta*r)^2) / ((1-r^2)^2 + (2*zeta*r)^2))
      var zetaTotal = Ta + Tc;
      var fNum = 1 + Math.pow(2 * zetaTotal * rr, 2);
      var fDen = Math.pow(1 - rr2, 2) + Math.pow(2 * zetaTotal * rr, 2);
      var Hforce = Math.sqrt(fNum / fDen);
      freqResponse.push({ freq: ff, dB: HdB, Hlin: Hlin, Hforce: Hforce });
    }

    // ============================================================
    // MAIN SIMULATION — forced + transient response (Main sheet rows 22+)
    // Particular solution (steady state) + homogeneous (transient)
    // ============================================================

    // Particular solution coefficients (F22, G22)
    var F = AE * wn * wn * (wn * wn - w * w) / (Math.pow(wn * wn - w * w, 2) + T * T * w * w);
    var G = AE * wn * wn * T * w / (Math.pow(wn * wn - w * w, 2) + T * T * w * w);

    // B1 = -F (C22)
    var B1 = -F;

    // w1 = damped/modified natural freq (H22)
    var w1;
    if (Math.abs(T - 2 * wn) < 1e-10) {
      w1 = 1;  // critically damped
    } else if (T < 2 * wn) {
      w1 = Math.sqrt(wn * wn - T * T / 4);  // underdamped
    } else {
      w1 = Math.sqrt(T * T / 4 - wn * wn);  // overdamped
    }

    // A1 (E22) = -(G*w + (T/2)*F) / w1
    var A1 = -(G * w + (T / 2) * F) / w1;

    var isUnderdamped = T < 2 * wn;
    var isCritical = Math.abs(T - 2 * wn) < 1e-10;

    // Time simulation
    var dt = 0.00025;  // 0.25ms steps
    var numSteps = 587;
    var tStart = 1.0;  // simulation starts at t=1.0

    var simData = [];

    for (var n = 0; n <= numSteps; n++) {
      var t = tStart + n * dt;

      // y(t) = particular + homogeneous (I column)
      var yt;
      if (isCritical) {
        yt = G * Math.sin(w * t) + F * Math.cos(w * t) + Math.exp(-T * t / 2) * (A1 * t + B1);
      } else if (isUnderdamped) {
        yt = G * Math.sin(w * t) + F * Math.cos(w * t) + Math.exp(-T * t / 2) * (A1 * Math.sin(w1 * t) + B1 * Math.cos(w1 * t));
      } else {
        yt = G * Math.sin(w * t) + F * Math.cos(w * t) + Math.exp(-T * t / 2) * (A1 * Math.sinh(w1 * t) + B1 * Math.cosh(w1 * t));
      }

      // extension (K column) = AE*cos(w*t) - y(t)
      var extension = AE * Math.cos(w * t) - yt;

      // stylus position (L column) = AE*cos(w*t)
      var stylusPos = AE * Math.cos(w * t);

      // For Sheet2: time relative to start
      var tRel = n * dt;

      simData.push({
        t: t,
        tRel: tRel * 1000,  // ms for plotting
        yt: yt,
        extension: extension * 1000,  // mm
        stylusPos: stylusPos * 1000,  // mm
      });
    }

    // ============================================================
    // TRANSIENT RESPONSE (Sheet3 columns F,G)
    // Damped cosine: exp(-zeta_overall * t) * cos(sqrt(1-zeta^2) * t)
    // ============================================================
    var transient = [];
    var tMax = 18.4;  // same range as spreadsheet
    var numTransSteps = 400;
    var zetaOvr = overallDamping;
    var wdNorm = Math.sqrt(1 - zetaOvr * zetaOvr);  // normalized damped freq

    for (var n = 0; n <= numTransSteps; n++) {
      var tt = tMax * n / numTransSteps;
      var amp = Math.exp(-zetaOvr * tt) * Math.cos(wdNorm * tt);
      transient.push({ time: tt, amplitude: amp });
    }

    // Min VTF required — from Sheet2 peak VTF during time-domain simulation
    // Sheet2 J column: vtf + (k * extension + zetaS2 * velocity) / 0.01
    // zetaS2 (Sheet2 B1) = 0.001 + cartridge damping coefficient
    var zetaS2 = 0.001 + (k * Math.sqrt(Math.pow(Z / k, 2) - 1)) / (2 * PI * dfreq);
    var maxVtfGf = vtf;

    for (var n = 1; n < simData.length; n++) {
      // extension (K column) in meters
      var ext_n = AE * Math.cos(w * simData[n].t) - simData[n].yt;

      // stylus position (L column) in mm, velocity from finite difference
      var sty_n = AE * Math.cos(w * simData[n].t) * 1000;
      var sty_prev = AE * Math.cos(w * simData[n - 1].t) * 1000;
      var vel = ((sty_n - sty_prev) / (dt)) / 1000;  // mm/s to m/s

      // VTF in gf (Sheet2 J column)
      var vGf = vtf + (k * ext_n + zetaS2 * vel) / 0.01;
      if (vGf > maxVtfGf) maxVtfGf = vGf;
    }

    var minVtf = maxVtfGf - vtf;

    // Resonant peak dB
    var peakDb = 0;
    if (overallDamping > 0 && overallDamping < 0.707) {
      peakDb = 20 * Math.log10(1 / (2 * overallDamping * Math.sqrt(1 - overallDamping * overallDamping)));
    }

    return {
      m: m * 1000,  // grams
      k: k,
      wn: wn,
      fn: wn / (2 * PI),
      fRes: fRes,
      cc: cc,
      Tc: Tc,
      cartQ: cartQ,
      Ta: Ta,
      armQ: armQ,
      calcArmDamping: calcArmDamping,
      overallDamping: overallDamping,
      overallQ: overallQ,
      dampingCoeff: dampingCoeff,
      peakDb: peakDb,
      minVtf: minVtf,
      velocityRms: velocityRms,
      riaaLevel: riaaLevel,
      freqResponse: freqResponse,
      transient: transient,
      vtf: vtf,
      T: T,
    };
  }

  // ============================================================
  // UI COMPONENTS
  // ============================================================

  function InputRow(props) {
    var localS = useState(String(props.value));
    var localVal = localS[0], setLocalVal = localS[1];
    // Sync from parent when value changes externally
    var prevRef = useRef(props.value);
    if (prevRef.current !== props.value) {
      prevRef.current = props.value;
      if (String(props.value) !== localVal) setLocalVal(String(props.value));
    }
    return h("div", { className: "tc-input-row" },
      h("label", { className: "tc-input-label" }, props.label),
      h("input", {
        type: "number",
        step: props.step || "any",
        min: props.min,
        max: props.max,
        value: localVal,
        onChange: function (e) {
          setLocalVal(e.target.value);
          var val = parseFloat(e.target.value);
          if (!isNaN(val)) props.onChange(val);
        },
        className: "tc-number-input",
      }),
      h("span", { className: "tc-input-unit" }, props.unit || "")
    );
  }

  function InfoRow(props) {
    var cls = "tc-info-value" + (props.highlight ? " tc-highlight" : "") + (props.warn ? " tc-warn" : "") + (props.danger ? " tc-danger" : "");
    return h("div", { className: "tc-info-row" },
      h("span", { className: "tc-info-label" }, props.label),
      h("span", null,
        h("span", { className: cls }, props.value),
        props.unit ? h("span", { className: "tc-info-unit" }, props.unit) : null
      )
    );
  }

  function Panel(props) {
    return h("div", { className: "tc-panel" },
      h("div", {
        className: "tc-panel-header",
        onClick: props.onToggle,
      },
        h("div", { className: "tc-panel-dot", style: { background: props.color } }),
        h("span", { className: "tc-panel-title" }, props.title),
        h("span", { className: "tc-panel-chevron" }, props.collapsed ? "\u25B6" : "\u25BC")
      ),
      !props.collapsed ? h("div", { className: "tc-panel-content" }, props.children) : null
    );
  }

  function ToggleGroup(props) {
    return h("div", { className: "tc-toggle-row" },
      h("label", { className: "tc-input-label" }, props.label),
      h("div", { className: "tc-toggle-group" },
        props.options.map(function (opt) {
          var isActive = opt.value === props.value;
          return h("button", {
            key: String(opt.value),
            className: "tc-toggle-btn" + (isActive ? " tc-toggle-active" : ""),
            onClick: function () { props.onChange(opt.value); },
          }, opt.label);
        })
      )
    );
  }

  // ============================================================
  // PLOT HELPERS
  // ============================================================
  var plotConfig = { responsive: true, displayModeBar: false };

  function basePlotLayout() {
    return {
      paper_bgcolor: "#0b0e14",
      plot_bgcolor: "#0f1319",
      font: { family: "IBM Plex Mono, SF Mono, monospace", color: "rgba(255,255,255,0.7)", size: 11 },
      showlegend: true,
      legend: { x: 1, xanchor: "right", y: 1, bgcolor: "rgba(0,0,0,0)", font: { size: 10 } },
      hovermode: "x unified",
    };
  }

  // ============================================================
  // MAIN APP
  // ============================================================
  function App() {
    var s = function (init) { return useState(init); };

    var vtfS = s(1.25);          var vtf = vtfS[0], setVtf = vtfS[1];
    var scS = s(40.0);           var staticComp = scS[0], setStaticComp = scS[1];
    var dcS = s(10.0);           var dynamicComp = dcS[0], setDynamicComp = dcS[1];
    var cfS = s(100.0);          var compFreq = cfS[0], setCompFreq = cfS[1];
    var amS = s(8.0);            var armMass = amS[0], setArmMass = amS[1];
    var cmS = s(9.0);            var cartMass = cmS[0], setCartMass = cmS[1];
    var adS = s(0.15);           var armDamping = adS[0], setArmDamping = adS[1];
    var mfS = s(315.0);          var modFreq = mfS[0], setModFreq = mfS[1];
    var maS = s(0.12);           var modAmplitude = maS[0], setModAmplitude = maS[1];
    var paS = s(4.2);            var peakA = paS[0], setPeakA = paS[1];
    var pbS = s(1.1);            var peakB = pbS[0], setPeakB = pbS[1];
    var dcOnS = s(false);        var dampingCalcOn = dcOnS[0], setDampingCalcOn = dcOnS[1];
    var exS = s(100);            var excitationUm = exS[0], setExcitationUm = exS[1];

    var colS = s({ freqResp: false, transient: false, vtfSweep: false, resonance: false, damping: false, modulation: false });
    var collapsed = colS[0], setCollapsed = colS[1];
    function togglePanel(id) {
      setCollapsed(function (prev) {
        var next = Object.assign({}, prev);
        next[id] = !next[id];
        return next;
      });
    }

    var freqPlotRef = useRef(null);
    var transPlotRef = useRef(null);
    var vtfPlotRef = useRef(null);

    var data = useMemo(function () {
      return calculate({
        vtf: vtf, staticComp: staticComp, dynamicComp: dynamicComp,
        compFreq: compFreq, armMass: armMass, cartMass: cartMass,
        armDamping: armDamping, modFreq: modFreq, modAmplitude: modAmplitude,
        peakA: peakA, peakB: peakB, dampingCalcOn: dampingCalcOn,
      });
    }, [vtf, staticComp, dynamicComp, compFreq, armMass, cartMass,
        armDamping, modFreq, modAmplitude, peakA, peakB, dampingCalcOn]);

    // Frequency response plot
    useEffect(function () {
      if (!freqPlotRef.current || !window.Plotly || collapsed.freqResp) return;

      var traces = [{
        x: data.freqResponse.map(function (p) { return p.freq; }),
        y: data.freqResponse.map(function (p) { return p.dB; }),
        name: "Damped",
        line: { color: "#00e5ff", width: 2 },
      }, {
        x: [data.fn, data.fn],
        y: [-15, Math.max(15, Math.ceil(data.peakDb + 2))],
        name: "f\u2099 undamped (" + data.fn.toFixed(1) + " Hz)",
        mode: "lines",
        line: { color: "rgba(255,196,0,0.5)", width: 1, dash: "dash" },
      }];

      var layout = Object.assign(basePlotLayout(), {
        margin: { t: 10, r: 20, b: 50, l: 60 },
        xaxis: {
          title: "Frequency (Hz)",
          type: "log",
          gridcolor: "rgba(255,255,255,0.06)",
          linecolor: "rgba(255,255,255,0.1)",
          range: [Math.log10(1), Math.log10(100)],
          fixedrange: true,
        },
        yaxis: {
          title: "dB",
          gridcolor: "rgba(255,255,255,0.06)",
          linecolor: "rgba(255,255,255,0.1)",
          zeroline: true,
          zerolinecolor: "rgba(255,255,255,0.2)",
          fixedrange: true,
          range: [-15, Math.max(15, Math.ceil(data.peakDb + 2))],
        },
      });

      Plotly.react(freqPlotRef.current, traces, layout, plotConfig);
    }, [data, collapsed.freqResp]);

    // Transient response plot — damped ringing decay
    useEffect(function () {
      if (!transPlotRef.current || !window.Plotly || collapsed.transient) return;

      var t = data.transient;

      var traces = [{
        x: t.map(function (p) { return p.time; }),
        y: t.map(function (p) { return p.amplitude; }),
        name: "Response",
        line: { color: "#22c55e", width: 2 },
      }];

      var layout = Object.assign(basePlotLayout(), {
        margin: { t: 10, r: 20, b: 50, l: 60 },
        showlegend: false,
        xaxis: {
          title: "Normalized time (\u03c9\u2099t)",
          gridcolor: "rgba(255,255,255,0.06)",
          linecolor: "rgba(255,255,255,0.1)",
          fixedrange: true,
        },
        yaxis: {
          title: "Amplitude",
          gridcolor: "rgba(255,255,255,0.06)",
          linecolor: "rgba(255,255,255,0.1)",
          zeroline: true,
          zerolinecolor: "rgba(255,255,255,0.2)",
          fixedrange: true,
          range: [-1.1, 1.1],
        },
      });

      Plotly.react(transPlotRef.current, traces, layout, plotConfig);
    }, [data, collapsed.transient]);

    // Contact force envelope — frequency response × excitation → gf around VTF
    useEffect(function () {
      if (!vtfPlotRef.current || !window.Plotly || collapsed.vtfSweep) return;

      var fr = data.freqResponse;
      var v = data.vtf;
      var excM = excitationUm / 1e6;  // µm to meters
      var forceScale = data.k * excM / 0.01;  // peak force in gf for 1× H

      var freqs = fr.map(function (p) { return p.freq; });
      var upper = fr.map(function (p) { return v + forceScale * p.Hforce; });
      var lower = fr.map(function (p) { return v - forceScale * p.Hforce; });

      // Wear multiplier: cycle-averaged (force^n) / (vtf^n), Hertzian n=1.5
      var wearExp = 1.5;
      var nIntSteps = 64;
      var baseWear = Math.pow(v, wearExp);
      var wear = fr.map(function (p) {
        var amp = forceScale * p.Hforce;
        var sum = 0;
        for (var wi = 0; wi < nIntSteps; wi++) {
          var theta = 2 * PI * wi / nIntSteps;
          var fInst = v + amp * Math.sin(theta);
          if (fInst < 0) fInst = 0;  // stylus lifts off, no wear
          sum += Math.pow(fInst, wearExp);
        }
        return (sum / nIntSteps) / baseWear;
      });

      var traces = [{
        x: freqs,
        y: upper,
        name: "Upper envelope",
        line: { color: "#00e5ff", width: 2 },
      }, {
        x: freqs,
        y: lower,
        name: "Lower envelope",
        line: { color: "#f97316", width: 2 },
      }, {
        x: [1, 100],
        y: [v, v],
        name: "Static VTF (" + v.toFixed(1) + " gf)",
        mode: "lines",
        line: { color: "rgba(255,255,255,0.5)", width: 1, dash: "dash" },
      }, {
        x: freqs,
        y: wear,
        name: "Relative wear",
        yaxis: "y2",
        line: { color: "#a855f7", width: 2 },
      }];

      var upperMax = Math.max.apply(null, upper);
      var lowerMin = Math.min.apply(null, lower);
      var maxSwing = Math.max(upperMax - v, v - lowerMin) * 1.2;
      var yMax = v + maxSwing;
      var yMin = v - maxSwing;

      var wearMax = Math.max.apply(null, wear);

      var layout = Object.assign(basePlotLayout(), {
        margin: { t: 10, r: 60, b: 50, l: 60 },
        xaxis: {
          title: "Frequency (Hz)",
          type: "log",
          gridcolor: "rgba(255,255,255,0.06)",
          linecolor: "rgba(255,255,255,0.1)",
          range: [Math.log10(1), Math.log10(100)],
          fixedrange: true,
        },
        yaxis: {
          title: "Contact force (gf)",
          gridcolor: "rgba(255,255,255,0.06)",
          linecolor: "rgba(255,255,255,0.1)",
          zeroline: false,
          fixedrange: true,
          range: [yMin, yMax],
        },
        yaxis2: {
          title: "Wear (×)",
          overlaying: "y",
          side: "right",
          gridcolor: "rgba(0,0,0,0)",
          linecolor: "rgba(255,255,255,0.1)",
          fixedrange: true,
          range: [0.9, Math.max(wearMax * 1.1, 1.2)],
        },
      });

      Plotly.react(vtfPlotRef.current, traces, layout, plotConfig);
    }, [data, excitationUm, collapsed.vtfSweep]);

    function fmt(val, digits) { return isFinite(val) ? val.toFixed(digits !== undefined ? digits : 2) : "\u2014"; }

    return h("div", null,
      h("h2", { className: "tc-title" },
        "Tonearm LF Mechanics ",
        h("span", { style: { color: "#ef4444", fontSize: "0.7em" } }, "Under Development")
      ),

      // === INPUTS ===
      h("div", { className: "tc-inputs" },
        h("div", { className: "tc-inputs-title" }, "Cartridge Parameters"),
        h(InputRow, { label: "VTF", value: vtf, onChange: setVtf, unit: "grams", step: 0.1, min: 0.1 }),
        h(InputRow, { label: "Static compliance", value: staticComp, onChange: setStaticComp, unit: "\u00b5m/mN", step: 1, min: 1 }),
        h(InputRow, { label: "Dynamic compliance", value: dynamicComp, onChange: setDynamicComp, unit: "\u00b5m/mN", step: 1, min: 1 }),
        h(InputRow, { label: "at frequency", value: compFreq, onChange: setCompFreq, unit: "Hz", step: 10, min: 1 }),

        h("div", { className: "tc-section-label" }, "Tonearm Parameters"),
        h(InputRow, { label: "Effective mass", value: armMass, onChange: setArmMass, unit: "grams", step: 0.5, min: 1 }),
        h(InputRow, { label: "Cart + fixings mass", value: cartMass, onChange: setCartMass, unit: "grams", step: 0.5, min: 1 }),
        h(ToggleGroup, {
          label: "Damping",
          options: [{ value: false, label: "Manual" }, { value: true, label: "Log Decrement" }],
          value: dampingCalcOn,
          onChange: setDampingCalcOn,
        }),
        dampingCalcOn ? h(InputRow, { label: "Peak A amplitude", value: peakA, onChange: setPeakA, step: 0.1, min: 0 }) : null,
        dampingCalcOn ? h(InputRow, { label: "Peak B amplitude", value: peakB, onChange: setPeakB, step: 0.1, min: 0 }) : null,
        !dampingCalcOn ? h(InputRow, { label: "Arm damping ratio", value: armDamping, onChange: setArmDamping, unit: "ratio", step: 0.01, min: 0 }) : null,

        h("div", { className: "tc-section-label" }, "Trackability"),
        h(InputRow, { label: "Frequency", value: modFreq, onChange: setModFreq, unit: "Hz", step: 1, min: 1 }),
        h(InputRow, { label: "Amplitude pk-pk", value: modAmplitude, onChange: setModAmplitude, unit: "mm", step: 0.01, min: 0.001 }),

        h("div", { className: "tc-section-label" }, "Excitation"),
        h(InputRow, { label: "Amplitude", value: excitationUm, onChange: setExcitationUm, unit: "\u00b5m", step: 5, min: 1, max: 2000 })
      ),

      // === OUTPUTS ===
      h("div", { className: "tc-outputs" },

        h(Panel, {
          title: "Frequency Response",
          color: "#00e5ff",
          collapsed: collapsed.freqResp,
          onToggle: function () { togglePanel("freqResp"); },
        },
          h("div", { ref: freqPlotRef, className: "tc-plot" })
        ),

        h(Panel, {
          title: "Transient Response",
          color: "#22c55e",
          collapsed: collapsed.transient,
          onToggle: function () { togglePanel("transient"); },
        },
          h("div", { ref: transPlotRef, className: "tc-plot" })
        ),

        h(Panel, {
          title: "Contact Force",
          color: "#f97316",
          collapsed: collapsed.vtfSweep,
          onToggle: function () { togglePanel("vtfSweep"); },
        },
          h("div", { ref: vtfPlotRef, className: "tc-plot" })
        ),

        h(Panel, {
          title: "Resonance",
          color: "#ffc400",
          collapsed: collapsed.resonance,
          onToggle: function () { togglePanel("resonance"); },
        },
          h(InfoRow, { label: "Total effective mass", value: fmt(data.m, 1), unit: "g" }),
          h(InfoRow, { label: "Natural frequency (undamped)", value: fmt(data.fn, 2), unit: "Hz" }),
          h(InfoRow, { label: "Resonant peak frequency", value: fmt(data.fRes, 2), unit: "Hz", highlight: true }),
          h(InfoRow, { label: "Resonant peak", value: fmt(data.peakDb, 1), unit: "dB" }),
          h(InfoRow, { label: "Min VTF required", value: fmt(data.minVtf, 2), unit: "gf" })
        ),

        h(Panel, {
          title: "Damping",
          color: "#a855f7",
          collapsed: collapsed.damping,
          onToggle: function () { togglePanel("damping"); },
        },
          h(InfoRow, { label: "Cartridge damping ratio", value: fmt(data.Tc, 2) }),
          h(InfoRow, { label: "Cartridge Q", value: fmt(data.cartQ, 1) }),
          h(InfoRow, { label: "Arm Q", value: fmt(data.armQ, 1) }),
          h(InfoRow, { label: "Overall Q", value: fmt(data.overallQ, 1), highlight: true }),
          h(InfoRow, { label: "Damping coeff", value: fmt(data.dampingCoeff, 2), unit: "Ns/m" }),
          dampingCalcOn ? h(InfoRow, { label: "Calculated arm damping", value: fmt(data.calcArmDamping, 2) }) : null
        ),

        h(Panel, {
          title: "Trackability",
          color: "#f97316",
          collapsed: collapsed.modulation,
          onToggle: function () { togglePanel("modulation"); },
        },
          h(InfoRow, { label: "Velocity (rms)", value: fmt(data.velocityRms, 2), unit: "cm/s" }),
          h(InfoRow, { label: "RIAA level", value: fmt(data.riaaLevel, 2), unit: "dB" })
        )
      )
    );
  }

  var root = document.getElementById("tonearm-calc");
  if (root) {
    ReactDOM.createRoot(root).render(h(App));
  }
})();
