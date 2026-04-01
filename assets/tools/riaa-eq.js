"use strict";
(function () {
  var h = React.createElement;
  var useState = React.useState;
  var useMemo = React.useMemo;
  var useEffect = React.useEffect;
  var useRef = React.useRef;

  // ============================================================
  // RIAA TIME CONSTANTS (seconds)
  // ============================================================
  var T1 = 3180e-6;  // 3180 µs — bass turnover
  var T2 = 318e-6;   // 318 µs — mid transition
  var T3 = 75e-6;    // 75 µs — treble shelf

  // ============================================================
  // TRANSFER FUNCTIONS
  // ============================================================

  // Full RIAA playback: H(s) = (1 + s*T2) / ((1 + s*T1)(1 + s*T3))
  function riaaFull(f) {
    var w = 2 * Math.PI * f;
    var num = Math.sqrt(1 + (w * T2) * (w * T2));
    var den1 = Math.sqrt(1 + (w * T1) * (w * T1));
    var den2 = Math.sqrt(1 + (w * T3) * (w * T3));
    return num / (den1 * den2);
  }

  // Turnover only: H(s) = (1 + s*T2) / (1 + s*T1)
  function riaaTurnover(f) {
    var w = 2 * Math.PI * f;
    var num = Math.sqrt(1 + (w * T2) * (w * T2));
    var den = Math.sqrt(1 + (w * T1) * (w * T1));
    return num / den;
  }

  // Shelf only: H(s) = 1 / (1 + s*T3)
  function riaaShelf(f) {
    var w = 2 * Math.PI * f;
    return 1 / Math.sqrt(1 + (w * T3) * (w * T3));
  }

  // Normalization: full RIAA at 1 kHz
  var NORM = riaaFull(1000);

  function toDb(linear) {
    return 20 * Math.log10(linear);
  }

  // ============================================================
  // STANDARD IEC FREQUENCIES
  // ============================================================
  var TABLE_FREQS = [
    20, 25, 31.5, 40, 50, 63, 80, 100, 125, 160,
    200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600,
    2000, 2500, 3150, 4000, 5000, 6300, 8000, 10000, 12500, 16000, 20000
  ];

  // ============================================================
  // COMPUTE VALUES FOR A MODE
  // ============================================================
  function computeTable(mode) {
    return TABLE_FREQS.map(function (f) {
      var result = {};
      result.freq = f;

      if (mode === "riaa") {
        result.dB = toDb(riaaFull(f) / NORM);
      } else if (mode === "inverse") {
        result.dB = toDb(NORM / riaaFull(f));
      } else if (mode === "turnover") {
        result.dB = toDb(riaaTurnover(f) / NORM);
      } else if (mode === "shelf") {
        result.dB = toDb(riaaShelf(f) / NORM);
      } else if (mode === "both") {
        result.turnover = toDb(riaaTurnover(f) / NORM);
        result.shelf = toDb(riaaShelf(f) / NORM);
        result.dB = toDb(riaaFull(f) / NORM);
      }
      return result;
    });
  }

  // ============================================================
  // GENERATE PLOT DATA
  // ============================================================
  function generatePlotData(mode) {
    // Log-spaced frequencies from 10 Hz to 30 kHz
    var freqs = [];
    var start = Math.log10(10);
    var end = Math.log10(30000);
    var steps = 500;
    for (var i = 0; i <= steps; i++) {
      freqs.push(Math.pow(10, start + (end - start) * i / steps));
    }

    var traces = [];

    if (mode === "riaa") {
      traces.push({
        x: freqs,
        y: freqs.map(function (f) { return toDb(riaaFull(f) / NORM); }),
        name: "RIAA",
        line: { color: "#00e5ff", width: 2 },
      });
    } else if (mode === "inverse") {
      traces.push({
        x: freqs,
        y: freqs.map(function (f) { return toDb(NORM / riaaFull(f)); }),
        name: "Inverse RIAA",
        line: { color: "#ff2d7b", width: 2 },
      });
    } else if (mode === "turnover") {
      traces.push({
        x: freqs,
        y: freqs.map(function (f) { return toDb(riaaTurnover(f) / NORM); }),
        name: "Turnover",
        line: { color: "#ffc400", width: 2 },
      });
    } else if (mode === "shelf") {
      traces.push({
        x: freqs,
        y: freqs.map(function (f) { return toDb(riaaShelf(f) / NORM); }),
        name: "Shelf",
        line: { color: "#a855f7", width: 2 },
      });
    } else if (mode === "both") {
      traces.push({
        x: freqs,
        y: freqs.map(function (f) { return toDb(riaaTurnover(f) / NORM); }),
        name: "Turnover",
        line: { color: "#ffc400", width: 2 },
      });
      traces.push({
        x: freqs,
        y: freqs.map(function (f) { return toDb(riaaShelf(f) / NORM); }),
        name: "Shelf",
        line: { color: "#a855f7", width: 2 },
      });
      traces.push({
        x: freqs,
        y: freqs.map(function (f) { return toDb(riaaFull(f) / NORM); }),
        name: "RIAA (sum)",
        line: { color: "#00e5ff", width: 2, dash: "dot" },
      });
    }

    return traces;
  }

  // ============================================================
  // PLOT LAYOUT
  // ============================================================
  var plotLayout = {
    paper_bgcolor: "#0b0e14",
    plot_bgcolor: "#0f1319",
    font: { family: "IBM Plex Mono, SF Mono, monospace", color: "rgba(255,255,255,0.7)", size: 11 },
    margin: { t: 20, r: 20, b: 50, l: 60 },
    xaxis: {
      title: "Frequency (Hz)",
      type: "log",
      gridcolor: "rgba(255,255,255,0.06)",
      linecolor: "rgba(255,255,255,0.1)",
      tickvals: [10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000],
      ticktext: ["10", "20", "50", "100", "200", "500", "1k", "2k", "5k", "10k", "20k"],
      range: [Math.log10(10), Math.log10(30000)],
    },
    yaxis: {
      title: "dB",
      gridcolor: "rgba(255,255,255,0.06)",
      linecolor: "rgba(255,255,255,0.1)",
      zeroline: true,
      zerolinecolor: "rgba(255,255,255,0.2)",
      zerolinewidth: 1,
    },
    legend: {
      x: 1, xanchor: "right", y: 1,
      bgcolor: "rgba(0,0,0,0)",
      font: { size: 11 },
    },
    hovermode: "x unified",
  };

  var plotConfig = {
    responsive: true,
    displayModeBar: false,
  };

  // ============================================================
  // FORMAT HELPERS
  // ============================================================
  function formatFreq(f) {
    if (f >= 1000) return (f / 1000) + "k";
    return String(f);
  }

  function formatDb(db) {
    var sign = db >= 0 ? "+" : "";
    return sign + db.toFixed(2);
  }

  // ============================================================
  // TOGGLE GROUP COMPONENT
  // ============================================================
  function ToggleGroup(props) {
    return h("div", { className: "riaa-toggle-row" },
      h("label", { className: "riaa-label" }, props.label),
      h("div", { className: "riaa-toggle-group" },
        props.options.map(function (opt) {
          var isActive = opt.value === props.value;
          return h("button", {
            key: opt.value,
            className: "riaa-toggle-btn" + (isActive ? " riaa-toggle-active" : ""),
            onClick: function () { props.onChange(opt.value); },
          }, opt.label);
        })
      )
    );
  }

  // ============================================================
  // MAIN APP
  // ============================================================
  function App() {
    var modeState = useState("riaa");
    var mode = modeState[0], setMode = modeState[1];
    var plotRef = useRef(null);

    var tableData = useMemo(function () {
      return computeTable(mode);
    }, [mode]);

    var plotData = useMemo(function () {
      return generatePlotData(mode);
    }, [mode]);

    // Render plot
    useEffect(function () {
      if (plotRef.current && window.Plotly) {
        Plotly.react(plotRef.current, plotData, plotLayout, plotConfig);
      }
    }, [plotData]);

    var isBoth = mode === "both";

    return h("div", null,
      h("h2", { className: "riaa-title" }, "RIAA Equalization"),

      // Mode selector
      h("div", { className: "riaa-inputs" },
        h(ToggleGroup, {
          label: "Curve",
          options: [
            { value: "riaa", label: "RIAA" },
            { value: "inverse", label: "Inverse" },
            { value: "turnover", label: "Turnover" },
            { value: "shelf", label: "Shelf" },
            { value: "both", label: "Both" },
          ],
          value: mode,
          onChange: setMode,
        })
      ),

      // Plot
      h("div", {
        ref: plotRef,
        className: "riaa-plot",
      }),

      // Table
      h("div", { className: "riaa-table-wrap" },
        h("table", { className: "riaa-table" },
          h("thead", null,
            h("tr", null,
              h("th", null, "Hz"),
              isBoth ? h("th", null, "Turnover") : null,
              isBoth ? h("th", null, "Shelf") : null,
              h("th", null, isBoth ? "RIAA" : "dB")
            )
          ),
          h("tbody", null,
            tableData.map(function (row) {
              var isRef = row.freq === 1000;
              var cls = isRef ? "riaa-ref-row" : "";
              return h("tr", { key: row.freq, className: cls },
                h("td", { className: "riaa-freq-cell" }, formatFreq(row.freq)),
                isBoth ? h("td", null, formatDb(row.turnover)) : null,
                isBoth ? h("td", null, formatDb(row.shelf)) : null,
                h("td", null, formatDb(row.dB))
              );
            })
          )
        )
      )
    );
  }

  // Mount
  var root = document.getElementById("riaa-eq");
  if (root) {
    ReactDOM.createRoot(root).render(h(App));
  }
})();
