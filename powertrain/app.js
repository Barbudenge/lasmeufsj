/* global CarPhysics */
(function () {
  "use strict";

  const model = CarPhysics;
  const svgNS = "http://www.w3.org/2000/svg";
  const localeByLang = { pt: "pt-BR", en: "en-US" };
  const MAX_ENGINE_RPM = 6500;
  const SPEEDOMETER_MAX_KMH = 220;
  const PEDAL_STEP_KMH = 5;
  const PEDAL_REPEAT_MS = 120;

  const i18n = {
    pt: {
      eyebrow: "Simulador didático",
      title: "Powertrain Interativo",
      subtitle:
        "Veja como motor, câmbio, diferencial e rodas mudam quando você acelera, troca marcha ou faz curva.",
      cockpitTitle: "Painel do motorista",
      cockpitControls: "Cockpit / Controles",
      technicalSettings: "Configurações técnicas",
      brakePedal: "Frear",
      throttlePedal: "Acelerar",
      vehicleSpeedInput: "Velocidade do carro",
      transmission: "Câmbio",
      differentialRatio: "Diferencial",
      wheelDiameter: "Roda",
      motion: "Trajetória",
      straight: "Reta",
      curve: "Curva",
      turnDirection: "Direção",
      left: "Esquerda",
      right: "Direita",
      radius: "Raio R (m)",
      track: "L (m)",
      gear: "Marcha",
      gearbox: "Diagrama esquemático",
      vehicle: "Carro",
      carHint: "Na curva, as rodas dianteiras usam ângulos diferentes para apontar ao centro da curva.",
      topView: "Vista superior",
      leftWheel: "Roda\nesquerda",
      rightWheel: "Roda\ndireita",
      outputsTitle: "Velocidades calculadas",
      vehicleSpeed: "Velocidade do carro",
      motorRpm: "Motor",
      countershaft: "Eixo intermediário",
      gearboxOutput: "Saída do câmbio",
      afterDifferential: "Após diferencial",
      steeringAngle: "Ângulo direção",
      leftWheelSpeedMetric: "Roda esquerda",
      rightWheelSpeedMetric: "Roda direita",
      engineLimit: "limite do motor",
      gearShort: "Marcha",
      ratio: "Relação",
      dark: "Escuro",
      light: "Claro",
      forward: "frente",
      reverse: "ré",
      neutral: "N",
      meshed: "Engrenadas",
      directPath: "acoplamento direto",
      reduction: "Redução",
    },
    en: {
      eyebrow: "Teaching simulator",
      title: "Interactive Powertrain",
      subtitle: "See how engine, gearbox, differential, and wheels change as you accelerate, shift, or turn.",
      cockpitTitle: "Driver panel",
      cockpitControls: "Cockpit / Controls",
      technicalSettings: "Technical settings",
      brakePedal: "Brake",
      throttlePedal: "Throttle",
      vehicleSpeedInput: "Vehicle speed",
      transmission: "Transmission",
      differentialRatio: "Final drive",
      wheelDiameter: "Wheel",
      motion: "Path",
      straight: "Straight",
      curve: "Curve",
      turnDirection: "Direction",
      left: "Left",
      right: "Right",
      radius: "Radius R (m)",
      track: "L (m)",
      gear: "Gear",
      gearbox: "Schematic diagram",
      vehicle: "Vehicle",
      carHint: "In a turn, front wheels use different angles to point toward the curve center.",
      topView: "Top view",
      leftWheel: "Left wheel",
      rightWheel: "Right wheel",
      outputsTitle: "Calculated speeds",
      vehicleSpeed: "Vehicle speed",
      motorRpm: "Engine",
      countershaft: "Countershaft",
      gearboxOutput: "Gearbox output",
      afterDifferential: "After differential",
      steeringAngle: "Steering angle",
      leftWheelSpeedMetric: "Left wheel",
      rightWheelSpeedMetric: "Right wheel",
      engineLimit: "engine limit",
      gearShort: "Gear",
      ratio: "Ratio",
      dark: "Dark",
      light: "Light",
      forward: "forward",
      reverse: "reverse",
      neutral: "N",
      meshed: "Meshed",
      directPath: "direct dog clutch",
      reduction: "Reduction",
    },
  };

  const state = {
    lang: localStorage.getItem("car-lab-lang") || "pt",
    theme: localStorage.getItem("car-lab-theme") || "dark",
    inputMode: "vehicle",
    inputValue: 30,
    transmissionId: "city-5",
    gearId: "1",
    differentialRatio: 2.9,
    wheelDiameterCm: 72,
    motion: "straight",
    turnDirection: "left",
    radiusM: 50,
    trackWidthM: 1.3,
    wheelbaseM: 2.6,
    activeComponent: "engine",
  };

  const dom = {};
  let currentResult = null;
  let frameId = null;
  let pedalTimer = null;
  let lastVisualFrame = 0;
  let editingSpeedReadout = false;

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    cacheDom();
    document.documentElement.dataset.theme = state.theme;
    populateTransmissions();
    populateWheelPresets();
    bindEvents();
    syncControlsFromState();
    applyLanguage();
    updateAll();
    frameId = requestAnimationFrame(animate);
  }

  function cacheDom() {
    [
      "languagePt",
      "languageEn",
      "themeDark",
      "themeLight",
      "throttleButton",
      "brakeButton",
      "transmissionSelect",
      "shiftGate",
      "diffRatio",
      "wheelPreset",
      "wheelDiameter",
      "curveControls",
      "radiusInput",
      "trackInput",
      "powerFlow",
      "speedometerSvg",
      "tachometerSvg",
      "engineFlowSvg",
      "differentialSvg",
      "speedReadout",
      "tachReadout",
      "gearboxSvg",
      "topCarSvg",
      "engineRpm",
      "countershaftRpm",
      "gearboxOutputRpm",
      "averageWheelRpm",
      "leftWheelRpm",
      "rightWheelRpm",
    ].forEach((id) => {
      dom[id] = document.getElementById(id);
    });
  }

  function bindEvents() {
    [dom.languagePt, dom.languageEn].forEach((button) => {
      button.addEventListener("click", () => {
        const nextLang = button.dataset.langOption;
        if (!nextLang || state.lang === nextLang) return;
        state.lang = nextLang;
        localStorage.setItem("car-lab-lang", state.lang);
        populateTransmissions();
        populateWheelPresets();
        applyLanguage();
        updateAll();
      });
    });

    [dom.themeDark, dom.themeLight].forEach((button) => {
      button.addEventListener("click", () => {
        const nextTheme = button.dataset.themeOption;
        if (!nextTheme || state.theme === nextTheme) return;
        state.theme = nextTheme;
        localStorage.setItem("car-lab-theme", state.theme);
        document.documentElement.dataset.theme = state.theme;
        applyLanguage();
        updateAll();
      });
    });

    bindPedal(dom.throttleButton, PEDAL_STEP_KMH);
    bindPedal(dom.brakeButton, -PEDAL_STEP_KMH);
    bindSpeedReadout();

    dom.transmissionSelect.addEventListener("change", () => {
      state.transmissionId = dom.transmissionSelect.value;
      const transmission = model.getTransmission(state.transmissionId);
      if (!transmission.gears.some((gear) => gear.id === state.gearId)) {
        state.gearId = transmission.gears.find((gear) => gear.id !== "r")?.id || transmission.gears[0].id;
      }
      applySpeedLimit();
      syncControlsFromState();
      updateAll();
    });

    dom.diffRatio.addEventListener("input", () => {
      state.differentialRatio = Number(dom.diffRatio.value);
      applySpeedLimit();
      syncControlsFromState();
      updateAll();
    });

    dom.wheelPreset.addEventListener("change", () => {
      const preset = model.WHEEL_PRESETS.find((item) => item.id === dom.wheelPreset.value);
      if (!preset) return;
      state.wheelDiameterCm = preset.diameterCm;
      applySpeedLimit();
      syncControlsFromState();
      updateAll();
    });

    dom.wheelDiameter.addEventListener("input", () => {
      state.wheelDiameterCm = Number(dom.wheelDiameter.value);
      dom.wheelPreset.value = "";
      applySpeedLimit();
      syncControlsFromState();
      updateAll();
    });

    document.querySelectorAll("[data-motion]").forEach((button) => {
      button.addEventListener("click", () => {
        state.motion = button.dataset.motion;
        syncControlsFromState();
        updateAll();
      });
    });

    document.querySelectorAll("[data-turn]").forEach((button) => {
      button.addEventListener("click", () => {
        state.turnDirection = button.dataset.turn;
        syncControlsFromState();
        updateAll();
      });
    });

    dom.radiusInput.addEventListener("input", () => {
      const value = Number(dom.radiusInput.value);
      if (!Number.isFinite(value)) return;
      state.radiusM = clampRadiusToTrack(value);
      dom.radiusInput.value = state.radiusM;
      updateAll();
    });

    dom.trackInput.addEventListener("input", () => {
      state.trackWidthM = Number(dom.trackInput.value);
      syncRadiusInputBounds();
      state.radiusM = clampRadiusToTrack(state.radiusM);
      dom.radiusInput.value = state.radiusM;
      updateAll();
    });

    document.querySelectorAll(".metric-card[data-component]").forEach((card) => {
      card.addEventListener("click", () => setActiveComponent(card.dataset.component));
    });
  }

  function bindSpeedReadout() {
    dom.speedReadout.addEventListener("focus", () => {
      editingSpeedReadout = true;
      window.getSelection()?.selectAllChildren(dom.speedReadout);
    });
    dom.speedReadout.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        dom.speedReadout.blur();
      }
      if (event.key === "Escape") {
        event.preventDefault();
        editingSpeedReadout = false;
        updateAll();
        dom.speedReadout.blur();
      }
    });
    dom.speedReadout.addEventListener("input", () => {
      const value = readSpeedReadoutValue();
      if (!Number.isFinite(value)) return;
      state.inputValue = clampSpeed(value);
      updateAll();
    });
    dom.speedReadout.addEventListener("blur", () => {
      editingSpeedReadout = false;
      const value = readSpeedReadoutValue();
      if (Number.isFinite(value)) state.inputValue = clampSpeed(value);
      syncControlsFromState();
      updateAll();
    });
    dom.speedReadout.addEventListener("paste", (event) => {
      event.preventDefault();
      const text = event.clipboardData?.getData("text/plain") || "";
      document.execCommand("insertText", false, text.replace(/[^\d,.]/g, ""));
    });
  }

  function readSpeedReadoutValue() {
    const raw = dom.speedReadout.textContent.trim().replace(/[^\d,.]/g, "").replace(",", ".");
    if (!raw) return Number.NaN;
    return Number.parseFloat(raw);
  }

  function bindPedal(button, delta) {
    const start = (event) => {
      event.preventDefault();
      button.setPointerCapture?.(event.pointerId);
      changeSpeed(delta);
      stopPedal();
      pedalTimer = window.setInterval(() => changeSpeed(delta), PEDAL_REPEAT_MS);
    };
    button.addEventListener("pointerdown", start);
    ["pointerup", "pointercancel", "pointerleave", "lostpointercapture"].forEach((eventName) => {
      button.addEventListener(eventName, stopPedal);
    });
    button.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        changeSpeed(delta);
      }
    });
  }

  function stopPedal() {
    if (!pedalTimer) return;
    window.clearInterval(pedalTimer);
    pedalTimer = null;
  }

  function changeSpeed(delta) {
    state.inputValue = clampSpeed(roundTo(state.inputValue + delta, 1));
    syncControlsFromState();
    updateAll();
  }

  function clampSpeed(value) {
    return roundTo(clamp(value, 0, currentGearMaxSpeedKmh()), 1);
  }

  function applySpeedLimit() {
    state.inputValue = clampSpeed(state.inputValue);
  }

  function currentGearMaxSpeedKmh() {
    const transmission = model.getTransmission(state.transmissionId);
    const gear = model.getGear(transmission, state.gearId);
    const ratio = Math.max(Math.abs(Number(gear.ratio) || 1), 0.0001);
    const diff = Math.max(Number(state.differentialRatio) || 1, 0.01);
    const diameter = Math.max(Number(state.wheelDiameterCm) || 1, 1);
    const wheelRpmAtLimit = MAX_ENGINE_RPM / ratio / diff;
    const maxByEngine = Math.abs(model.signedSpeedKmhFromWheelRpm(wheelRpmAtLimit, diameter));
    return Math.min(SPEEDOMETER_MAX_KMH, maxByEngine);
  }

  function populateTransmissions() {
    dom.transmissionSelect.replaceChildren();
    model.TRANSMISSIONS.forEach((transmission) => {
      const option = document.createElement("option");
      option.value = transmission.id;
      option.textContent = transmission.name[state.lang];
      dom.transmissionSelect.append(option);
    });
  }

  function populateWheelPresets() {
    const selected = model.WHEEL_PRESETS.find((item) => item.diameterCm === Number(state.wheelDiameterCm));
    dom.wheelPreset.replaceChildren();
    const custom = document.createElement("option");
    custom.value = "";
    custom.textContent = state.lang === "pt" ? "Personalizada" : "Custom";
    dom.wheelPreset.append(custom);
    model.WHEEL_PRESETS.forEach((preset) => {
      const option = document.createElement("option");
      option.value = preset.id;
      option.textContent = preset.label[state.lang];
      dom.wheelPreset.append(option);
    });
    dom.wheelPreset.value = selected ? selected.id : "";
  }

  function syncControlsFromState() {
    state.inputMode = "vehicle";
    state.radiusM = clampRadiusToTrack(state.radiusM);
    dom.transmissionSelect.value = state.transmissionId;
    dom.diffRatio.value = state.differentialRatio;
    dom.wheelDiameter.value = state.wheelDiameterCm;
    dom.radiusInput.value = state.radiusM;
    dom.trackInput.value = state.trackWidthM;
    syncRadiusInputBounds();
    const wheelPreset = model.WHEEL_PRESETS.find((item) => item.diameterCm === Number(state.wheelDiameterCm));
    dom.wheelPreset.value = wheelPreset ? wheelPreset.id : "";

    document.querySelectorAll("[data-motion]").forEach((button) => {
      button.classList.toggle("active", button.dataset.motion === state.motion);
    });
    document.querySelectorAll("[data-turn]").forEach((button) => {
      button.classList.toggle("active", button.dataset.turn === state.turnDirection);
    });
    document.querySelectorAll(".curve-controls").forEach((node) => {
      node.classList.toggle("is-muted", state.motion !== "curve");
    });
    renderShiftGate();
  }

  function applyLanguage() {
    document.documentElement.lang = state.lang === "pt" ? "pt-BR" : "en";
    document.title = t("title");
    document.querySelectorAll("[data-i18n]").forEach((node) => {
      const key = node.dataset.i18n;
      if (t(key)) node.textContent = t(key);
    });
    [dom.languagePt, dom.languageEn].forEach((button) => {
      const active = button.dataset.langOption === state.lang;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
    [dom.themeDark, dom.themeLight].forEach((button) => {
      const active = button.dataset.themeOption === state.theme;
      const label = t(button.dataset.themeOption);
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
      button.setAttribute("aria-label", label);
      button.setAttribute("title", label);
    });
    dom.speedReadout.setAttribute("aria-label", t("vehicleSpeedInput"));
    renderShiftGate();
  }

  function syncRadiusInputBounds() {
    dom.radiusInput.min = String(minCurveRadius());
  }

  function clampRadiusToTrack(value) {
    return Math.max(Number(value) || 0, minCurveRadius());
  }

  function minCurveRadius() {
    return roundTo(Math.max((Number(state.trackWidthM) || 0) / 2, 0.2), 4);
  }

  function updateAll() {
    state.inputMode = "vehicle";
    applySpeedLimit();
    currentResult = model.calculate(state);
    const result = currentResult;
    const speedAbs = Math.abs(result.vehicleSpeedKmh);
    const maxSpeed = currentGearMaxSpeedKmh();
    const limited = speedAbs >= maxSpeed - 0.05 && maxSpeed < SPEEDOMETER_MAX_KMH;

    dom.powerFlow.textContent = powerFlowText(result);

    if (!editingSpeedReadout) setText("speedReadout", formatNumber(speedAbs, 1));
    setText("tachReadout", formatNumber(result.engineRpm, 0));
    setText("engineRpm", formatNumber(result.engineRpm, 1));
    setText("countershaftRpm", formatNumber(result.countershaftRpm, 1));
    setText("gearboxOutputRpm", formatNumber(result.gearboxOutputRpm, 1));
    setText("averageWheelRpm", formatNumber(result.averageWheelRpm, 1));
    setText("leftWheelRpm", formatNumber(result.leftWheelRpm, 1));
    setText("rightWheelRpm", formatNumber(result.rightWheelRpm, 1));

    updateGauge(dom.speedometerSvg, {
      value: speedAbs,
      max: SPEEDOMETER_MAX_KMH,
      label: "km/h",
      dangerFrom: 170,
    });
    updateGauge(dom.tachometerSvg, {
      value: result.engineRpm,
      max: MAX_ENGINE_RPM,
      label: "rpm",
      dangerFrom: MAX_ENGINE_RPM * 0.86,
    });
    updateActiveComponent();
    renderGearbox(result);
    renderTopCar(result, performance.now());
  }

  function powerFlowText(result) {
    return `${t("reduction")}: ${formatNumber(Math.abs(result.ratio), 2)}\n\n${t("meshed")}:\n${gearPathText(result)}`;
  }

  function gearPathText(result) {
    return schematicGearPathText(result.transmission, result.gear);
  }

  function schematicGearPathText(transmission, gear) {
    const numberLabels = schematicGearNumbers(transmission);
    const fixedInput = numberLabels.fixed.top;
    const fixedCounter = numberLabels.fixed.lower;
    const prefix = `${fixedInput} -> ${fixedCounter}`;
    if (gear.id === "r") {
      const reverseLabels = [numberLabels.reverse.lower, numberLabels.reverse.idler, numberLabels.reverse.top];
      return `${prefix} -> ${reverseLabels.join(" -> ")}`;
    }
    const pairLabels = numberLabels.gears[gear.id];
    if (gear.visualPath === "direct") {
      return `${pairLabels.top} -> ${t("directPath")}`;
    }
    return `${prefix} -> ${pairLabels.lower} -> ${pairLabels.top}`;
  }

  function setActiveComponent(component) {
    state.activeComponent = component || "vehicle";
    updateActiveComponent();
  }

  function updateActiveComponent() {
    document.querySelectorAll("[data-component]").forEach((node) => {
      node.classList.toggle("active", node.dataset.component === state.activeComponent);
      if (node.classList.contains("metric-card")) {
        node.setAttribute("aria-pressed", String(node.dataset.component === state.activeComponent));
      }
    });
  }

  function renderShiftGate() {
    const transmission = model.getTransmission(state.transmissionId);
    const layout = shiftLayout(transmission);
    dom.shiftGate.replaceChildren();

    const plate = document.createElement("div");
    plate.className = "shift-plate";
    dom.shiftGate.append(plate);

    const lines = document.createElementNS(svgNS, "svg");
    lines.setAttribute("class", "shift-lines");
    lines.setAttribute("viewBox", "0 0 100 100");
    lines.setAttribute("aria-hidden", "true");
    plate.append(lines);

    addSvg(lines, "line", {
      x1: layout.railStart,
      y1: 50,
      x2: layout.railEnd,
      y2: 50,
      class: "shift-rail-svg",
    });
    layout.columns.forEach((x) => {
      addSvg(lines, "line", {
        x1: x,
        y1: layout.topY,
        x2: x,
        y2: layout.bottomY,
        class: "shift-rail-svg",
      });
    });

    const neutral = document.createElement("div");
    neutral.className = "neutral-node";
    neutral.style.left = "50%";
    neutral.style.top = "50%";
    neutral.textContent = t("neutral");
    plate.append(neutral);

    transmission.gears.forEach((gear) => {
      const pos = layout.positions[gear.id] || { x: layout.columns[0], y: layout.topY };
      const button = document.createElement("button");
      button.type = "button";
      button.className = `shift-button${gear.id === state.gearId ? " active" : ""}`;
      button.style.left = `${pos.x}%`;
      button.style.top = `${pos.y}%`;
      button.textContent = gear.label;
      button.title = `${t("ratio")}: ${formatNumber(gear.ratio, 2)}`;
      button.addEventListener("click", () => {
        state.gearId = gear.id;
        applySpeedLimit();
        syncControlsFromState();
        updateAll();
      });
      plate.append(button);
    });
  }

  function shiftLayout(transmission) {
    const ids = new Set(transmission.gears.map((gear) => gear.id));
    const hasReverse = ids.has("r");
    let columnCount = ids.has("6") && hasReverse ? 4 : 3;
    if (!ids.has("5") && !ids.has("6") && !hasReverse) columnCount = 2;
    const columns =
      columnCount === 4
        ? [15, 38, 62, 85]
        : columnCount === 2
          ? [34, 66]
          : [22, 50, 78];
    const topY = 24;
    const bottomY = 76;
    const positions = {};
    if (ids.has("1")) positions["1"] = { x: columns[0], y: topY };
    if (ids.has("2")) positions["2"] = { x: columns[0], y: bottomY };
    if (ids.has("3")) positions["3"] = { x: columns[1] || columns[0], y: topY };
    if (ids.has("4")) positions["4"] = { x: columns[1] || columns[0], y: bottomY };
    if (ids.has("5")) positions["5"] = { x: columns[2] || columns[1], y: topY };
    if (ids.has("6")) positions["6"] = { x: columns[2] || columns[1], y: bottomY };
    if (hasReverse) {
      positions.r = ids.has("6")
        ? { x: columns[3], y: topY }
        : ids.has("5")
          ? { x: columns[2], y: bottomY }
          : { x: columns[2] || columns[1], y: topY };
    }
    return {
      columns,
      topY,
      bottomY,
      railStart: columns[0],
      railEnd: columns[columns.length - 1],
      positions,
    };
  }

  const GAUGE_CENTER_X = 130;
  const GAUGE_CENTER_Y = 96;
  const GAUGE_ARC_RADIUS = 91;
  const GAUGE_FILL_RADIUS = 90;
  const GAUGE_MIN_ANGLE = -118;
  const GAUGE_MAX_ANGLE = 118;

  function updateGauge(svg, config) {
    if (!svg.dataset.ready) renderGaugeFace(svg, config);
    const ratio = clamp(config.value / config.max, 0, 1);
    const angle = GAUGE_MIN_ANGLE + (GAUGE_MAX_ANGLE - GAUGE_MIN_ANGLE) * ratio;
    const needle = svg.querySelector(".gauge-needle");
    const fill = svg.querySelector(".gauge-fill");
    if (needle) {
      const previousAngle = Number(needle.dataset.angle);
      if (Number.isFinite(previousAngle) && Math.abs(previousAngle - angle) > 0.2 && needle.animate) {
        needle.animate(
          [
            { transform: `rotate(${previousAngle}deg)` },
            { transform: `rotate(${angle + (angle - previousAngle) * 0.08}deg)` },
            { transform: `rotate(${angle}deg)` },
          ],
          {
            duration: 640,
            easing: "cubic-bezier(0.16, 1, 0.3, 1)",
          },
        );
      }
      needle.style.transform = `rotate(${angle}deg)`;
      needle.dataset.angle = String(angle);
    }
    if (fill) fill.setAttribute("d", describeArc(GAUGE_CENTER_X, GAUGE_CENTER_Y, GAUGE_FILL_RADIUS, GAUGE_MIN_ANGLE, angle));
  }

  function renderGaugeFace(svg, config) {
    svg.replaceChildren();
    addSvg(svg, "path", {
      d: describeArc(GAUGE_CENTER_X, GAUGE_CENTER_Y, GAUGE_ARC_RADIUS, GAUGE_MIN_ANGLE, GAUGE_MAX_ANGLE),
      class: "gauge-track",
    });
    addSvg(svg, "path", {
      d: describeArc(GAUGE_CENTER_X, GAUGE_CENTER_Y, GAUGE_ARC_RADIUS, angleForValue(config.dangerFrom, config.max), GAUGE_MAX_ANGLE),
      class: "gauge-danger",
    });
    addSvg(svg, "path", {
      d: describeArc(GAUGE_CENTER_X, GAUGE_CENTER_Y, GAUGE_FILL_RADIUS, GAUGE_MIN_ANGLE, GAUGE_MIN_ANGLE),
      class: "gauge-fill",
    });
    for (let i = 0; i <= 10; i += 1) {
      const angle = GAUGE_MIN_ANGLE + i * ((GAUGE_MAX_ANGLE - GAUGE_MIN_ANGLE) / 10);
      const p1 = polarToCartesian(GAUGE_CENTER_X, GAUGE_CENTER_Y, i % 5 === 0 ? 73 : 80, angle);
      const p2 = polarToCartesian(GAUGE_CENTER_X, GAUGE_CENTER_Y, 92, angle);
      addSvg(svg, "line", { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, class: "gauge-tick" });
    }
    addSvg(svg, "text", { x: GAUGE_CENTER_X, y: 28, class: "gauge-title" }, config.label);
    addSvg(svg, "circle", { cx: GAUGE_CENTER_X, cy: GAUGE_CENTER_Y, r: 9, class: "needle-hub" });
    const needle = addSvg(svg, "g", { class: "gauge-needle" });
    addSvg(needle, "path", {
      d: `M${GAUGE_CENTER_X} ${GAUGE_CENTER_Y} L${GAUGE_CENTER_X - 6} ${GAUGE_CENTER_Y - 4} L${GAUGE_CENTER_X} 17 L${GAUGE_CENTER_X + 6} ${GAUGE_CENTER_Y - 4} Z`,
      class: "needle-shape",
    });
    svg.dataset.ready = "true";
  }

  function renderGearbox(result) {
    const labels = schematicLabels();
    renderEngineFlow(result, labels);
    renderGearboxFlow(result, labels);
    renderDifferentialFlow(result, labels);
    updateActiveComponent();
  }

  function schematicLabels() {
    return state.lang === "pt"
      ? {
          engine: "Motor",
          gearbox: "Câmbio",
          countershaft: "eixo intermediário",
          output: "saída",
          differential: "Diferencial",
          leftWheel: "Roda\nesquerda",
          rightWheel: "Roda\ndireita",
          vehicle: "velocidade do carro",
          steering: "direção",
        }
      : {
          engine: "Engine",
          gearbox: "Gearbox",
          countershaft: "countershaft",
          output: "output",
          differential: "Differential",
          leftWheel: "left\nwheel",
          rightWheel: "right\nwheel",
          vehicle: "vehicle speed",
          steering: "steering",
        };
  }

  function renderEngineFlow(result, labels) {
    const svg = dom.engineFlowSvg;
    svg.replaceChildren();
    addSvg(svg, "rect", { x: 16, y: 18, width: 748, height: 184, rx: 12, class: "schematic-floor" });
    const engine = componentGroup(svg, "engine", "schematic-engine");
    drawFourCylinderEngine(engine, result.engineRpm);
  }

  function drawFourCylinderEngine(parent, rpm) {
    const root = addSvg(parent, "g", { transform: "rotate(90 390 110)" });
    addSvg(root, "rect", { x: 296, y: -174, width: 188, height: 568, rx: 18, class: "component-box engine-box four-cylinder-block" });
    const centers = [-92, 36, 164, 292];
    centers.forEach((cy, index) => drawInlinePiston(root, 390, cy, rpm, index * 0.5));
    addSvg(parent, "line", { x1: 104, y1: 110, x2: 676, y2: 110, class: "shaft motion", style: shaftStyle(rpm) });
  }

  function drawInlinePiston(parent, cx, cy, rpm, phase) {
    const period = visualPeriod(rpm, 0.75);
    const durationSeconds = Number.parseFloat(period) || 1;
    const shouldAnimate = Math.abs(Number(rpm) || 0) >= 0.1;
    const slide = 12;
    const pistonX = cx - 45;
    const crankX = cx + 45;
    const piston = addSvg(parent, "g", { class: "engine-piston-slide" });
    addSvg(piston, "rect", { x: pistonX - 19, y: cy - 21, width: 38, height: 42, rx: 6, class: "engine-piston" });
    addSvg(piston, "circle", { cx: pistonX, cy, r: 4.5, class: "engine-pin" });
    const rod = addSvg(parent, "line", { x1: pistonX + slide, y1: cy, x2: crankX - 9, y2: cy, class: "engine-rod" });
    addSvg(parent, "circle", { cx: crankX, cy, r: 21, class: "engine-crank-case" });
    const crank = addSvg(parent, "g", { class: "engine-crank" });
    addSvg(crank, "line", { x1: crankX, y1: cy, x2: crankX + 15, y2: cy, class: "engine-crank-arm" });
    addSvg(crank, "circle", { cx: crankX + 15, cy, r: 4.5, class: "engine-pin" });
    addSvg(parent, "circle", { cx: crankX, cy, r: 4, class: "engine-pin center" });

    if (!shouldAnimate) return;
    const begin = `${-(durationSeconds * phase)}s`;
    addSvg(piston, "animateTransform", {
      attributeName: "transform",
      type: "translate",
      values: `${slide} 0;${-slide} 0;${slide} 0`,
      dur: period,
      begin,
      repeatCount: "indefinite",
    });
    addSvg(rod, "animate", { attributeName: "x1", values: `${pistonX + slide};${pistonX - slide};${pistonX + slide}`, dur: period, begin, repeatCount: "indefinite" });
    addSvg(crank, "animateTransform", {
      attributeName: "transform",
      type: "rotate",
      from: `0 ${crankX} ${cy}`,
      to: `360 ${crankX} ${cy}`,
      dur: period,
      begin,
      repeatCount: "indefinite",
    });
  }

  function renderGearboxFlow(result, labels) {
    const svg = dom.gearboxSvg;
    svg.replaceChildren();
    const transmission = result.transmission;
    const activeGear = result.gear;
    const pairs = transmission.gears.filter((gear) => gear.id !== "r");
    const usablePairs = pairs.length ? pairs : [{ id: "1", label: "1", ratio: 1, visualPath: "direct" }];

    const topY = 105;
    const lowerY = 225;
    const boxX = 62;
    const boxW = 656;
    const reverse = transmission.gears.find((gear) => gear.id === "r");
    const toothData = deriveSchematicTeeth(transmission);
    const numberLabels = schematicGearNumbers(transmission);
    const reverseX = boxX + boxW - 56;
    const gearStart = usablePairs.length >= 5 ? boxX + 106 : boxX + 138;
    const gearEnd = reverse ? reverseX - 84 : boxX + boxW - 72;
    const spacing = usablePairs.length > 1 ? (gearEnd - gearStart) / (usablePairs.length - 1) : 0;
    const gearWidth = usablePairs.length >= 5 ? 24 : 26;
    const topShaftStart = boxX + 20;
    const topShaftEnd = boxX + boxW - 18;
    const lowerShaftStart = boxX + 20;
    const lowerShaftEnd = boxX + boxW - 18;
    const fixedGearX = boxX + 40;
    const topShaftSplitX = fixedGearX + 44;

    addSvg(svg, "rect", { x: 16, y: 18, width: 748, height: 300, rx: 12, class: "schematic-floor" });

    const gearbox = componentGroup(svg, "gearbox", "schematic-gearbox");
    addSvg(gearbox, "rect", { x: boxX, y: 12, width: boxW, height: 306, rx: 12, class: "component-box gearbox-box" });
    addTopGearboxShaft(gearbox, {
      y: topY,
      startX: topShaftStart,
      splitX: topShaftSplitX,
      endX: topShaftEnd,
      fixedGearX,
      gearStart,
      spacing,
      usablePairs,
      reverseX,
      activeGear,
      rpm: result.gearboxOutputRpm,
    });

    const countershaft = componentGroup(svg, "countershaft", "schematic-countershaft");
    addLowerGearboxShaft(countershaft, {
      y: lowerY,
      startX: lowerShaftStart,
      endX: lowerShaftEnd,
      fixedGearX,
      gearStart,
      spacing,
      usablePairs,
      reverseX,
      activeGear,
      rpm: result.countershaftRpm,
    });

    addDiscPair(gearbox, {
      x: boxX + 40,
      topY,
      lowerY,
      width: 20,
      topHeight: gearHeightForTeeth(toothData.input),
      lowerHeight: gearHeightForTeeth(toothData.counter),
      topLabel: gearToothLabel(numberLabels.fixed.top, toothData.input, "top"),
      lowerLabel: gearToothLabel(numberLabels.fixed.lower, toothData.counter, "bottom"),
      active: true,
      always: true,
      meshActive: activeGear.visualPath !== "direct",
      topRpm: result.engineRpm,
      lowerRpm: result.countershaftRpm,
    });

    usablePairs.forEach((gear, index) => {
      const x = gearStart + index * spacing;
      const active = gear.id === activeGear.id && gear.visualPath !== "direct";
      const direct = gear.id === activeGear.id && gear.visualPath === "direct";
      const heightBase = clamp(Math.abs(Number(gear.ratio)) * 10, 26, 52);
      const teeth = toothData.gears[gear.id];
      const pairLabels = numberLabels.gears[gear.id];
      const topLabel = teeth ? gearToothLabel(pairLabels.top, teeth.top, "top") : gear.label;
      const lowerLabel = teeth ? gearToothLabel(pairLabels.lower, teeth.lower, "bottom") : gear.label;

      if (gear.visualPath === "direct") {
        addDirectClutch(gearbox, x, topY, direct, pairLabels.top);
      } else {
        addDiscPair(gearbox, {
          x,
          topY,
          lowerY,
          width: gearWidth,
          topHeight: teeth ? gearHeightForTeeth(teeth.top) : clamp(56 - heightBase * 0.25, 28, 48),
          lowerHeight: teeth ? gearHeightForTeeth(teeth.lower) : heightBase,
          topLabel,
          lowerLabel,
          active,
          topRpm: active ? result.gearboxOutputRpm : result.gearboxOutputRpm * 0.65,
          lowerRpm: result.countershaftRpm,
        });
      }
    });

    if (reverse) {
      addReverseSet(gearbox, reverseX, topY, lowerY, activeGear.id === "r", result, toothData.reverse, numberLabels.reverse);
    }
  }

  function renderDifferentialFlow(result, labels) {
    const svg = dom.differentialSvg;
    svg.replaceChildren();
    addSvg(svg, "rect", { x: 16, y: 18, width: 748, height: 224, rx: 12, class: "schematic-floor" });

    const differentialLayout = {
      x: 254,
      y: 44,
      width: 272,
      height: 172,
      wheelX: 292,
      wheelWidth: 196,
      wheelHeight: 44,
      topWheelY: 16,
      bottomWheelY: 216,
      blueScale: 0.86,
    };
    const visual = addSvg(svg, "g", { transform: "translate(390 130) scale(-1 1) rotate(90) translate(-390 -130)" });
    const differential = componentGroup(visual, "differential", "schematic-differential");
    const hiddenLabels = { ...labels, differential: "", leftWheel: "", rightWheel: "" };
    drawSchematicDifferential(differential, result, hiddenLabels, 248, 130, differentialLayout);

    const leftWheel = componentGroup(visual, "leftWheel", "schematic-wheel");
    drawSchematicWheel(leftWheel, differentialLayout.wheelX, differentialLayout.topWheelY, differentialLayout.wheelWidth, differentialLayout.wheelHeight, "", differentialLayout.topWheelY - 8, result.leftWheelRpm);

    const rightWheel = componentGroup(visual, "rightWheel", "schematic-wheel");
    drawSchematicWheel(rightWheel, differentialLayout.wheelX, differentialLayout.bottomWheelY, differentialLayout.wheelWidth, differentialLayout.wheelHeight, "", 250, result.rightWheelRpm);
    addSvgMultilineText(svg, 230, 132, labels.leftWheel, "svg-label center");
    addSvgMultilineText(svg, 550, 132, labels.rightWheel, "svg-label center");
  }

  function componentGroup(parent, component, className = "") {
    const group = addSvg(parent, "g", {
      class: `component-hit ${className}${state.activeComponent === component ? " active" : ""}`,
      "data-component": component,
      tabindex: "0",
      role: "button",
    });
    group.addEventListener("click", (event) => {
      event.stopPropagation();
      setActiveComponent(component);
    });
    group.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setActiveComponent(component);
      }
    });
    return group;
  }

  function addShaft(svg, x1, y, x2, rpm) {
    addSvg(svg, "line", { x1, y1: y, x2, y2: y, class: "shaft base" });
    addSvg(svg, "line", { x1, y1: y, x2, y2: y, class: "shaft motion", style: shaftStyle(rpm) });
  }

  function addTopGearboxShaft(svg, config) {
    const gap = 8;
    addSvg(svg, "line", { x1: config.startX, y1: config.y, x2: config.splitX - gap, y2: config.y, class: "shaft base" });
    addSvg(svg, "line", { x1: config.splitX + gap, y1: config.y, x2: config.endX, y2: config.y, class: "shaft base" });

    const motionStartX = topGearboxMotionStartX(config);
    if (motionStartX === null || motionStartX >= config.endX) return;
    addSvg(svg, "line", {
      x1: motionStartX,
      y1: config.y,
      x2: config.endX,
      y2: config.y,
      class: "shaft motion",
      style: shaftStyle(config.rpm),
    });
  }

  function topGearboxMotionStartX(config) {
    if (config.activeGear.id === "r") return config.reverseX + 34;
    const index = config.usablePairs.findIndex((gear) => gear.id === config.activeGear.id);
    if (index < 0) return null;
    if (config.activeGear.visualPath === "direct") return config.fixedGearX;
    return config.gearStart + index * config.spacing;
  }

  function addLowerGearboxShaft(svg, config) {
    addSvg(svg, "line", { x1: config.startX, y1: config.y, x2: config.endX, y2: config.y, class: "shaft base" });

    const motionRange = lowerGearboxMotionRange(config);
    if (!motionRange) return;
    addSvg(svg, "line", {
      x1: motionRange.x1,
      y1: config.y,
      x2: motionRange.x2,
      y2: config.y,
      class: "shaft motion",
      style: shaftStyle(config.rpm),
    });
  }

  function lowerGearboxMotionRange(config) {
    let activeX = null;
    if (config.activeGear.id === "r") {
      activeX = config.reverseX - 34;
    } else if (config.activeGear.visualPath === "direct") {
      return null;
    } else {
      const index = config.usablePairs.findIndex((gear) => gear.id === config.activeGear.id);
      if (index < 0) return null;
      activeX = config.gearStart + index * config.spacing;
    }

    return {
      x1: Math.min(config.fixedGearX, activeX),
      x2: Math.max(config.fixedGearX, activeX),
    };
  }

  function addDiscPair(svg, config) {
    const gearsActive = config.active || config.always;
    const meshActive = config.meshActive ?? config.active;
    addMeshLine(svg, config.x, config.topY, config.x, config.lowerY, meshActive);
    const width = config.width || 28;
    addRectGear(svg, config.x, config.topY, width, config.topHeight, config.topLabel, config.topRpm, gearsActive, false, config.topMotion || "down");
    addRectGear(svg, config.x, config.lowerY, width, config.lowerHeight, config.lowerLabel, config.lowerRpm, gearsActive, false, config.lowerMotion || "up");
  }

  function addRectGear(svg, x, y, width, height, label, rpm, active, reverse, stripeDirection = "down") {
    const group = addSvg(svg, "g", { class: `rect-gear${active ? " active" : ""}${reverse ? " reverse" : ""}` });
    const rectX = x - width / 2;
    const rectY = y - height / 2;
    addSvg(group, "rect", {
      x: rectX,
      y: rectY,
      width,
      height,
      rx: 4,
      class: "gear-rect",
    });
    addGearMotionLines(group, x, y, width, height, active ? rpm : 0, stripeDirection);
    addSvg(group, "line", {
      x1: rectX,
      y1: y,
      x2: rectX + width,
      y2: y,
      class: `gear-center-line${active ? " active" : ""}`,
      style: shaftStyle(rpm),
    });
    const labelSpec = typeof label === "object" && label !== null ? label : { text: label, position: "top" };
    const lines = String(labelSpec.text).split("\n");
    const position = labelSpec.position || "top";
    const textX = position === "right" ? x + width / 2 + 10 : x;
    const textY =
      position === "right"
        ? y - ((lines.length - 1) * 13) / 2 + 4
        : position === "bottom"
        ? y + height / 2 + 13
        : y - height / 2 - 6 - (lines.length - 1) * 13;
    const text = addSvg(group, "text", { x: textX, y: textY, class: `gear-text${position === "right" ? " side-label" : ""}` });
    lines.forEach((line, index) => {
      const tspan = addSvg(text, "tspan", { x: textX, dy: index === 0 ? 0 : 13 });
      tspan.textContent = line;
    });
  }

  function addDirectClutch(svg, x, y, active, label) {
    const width = 38;
    const height = 48;
    addSvg(svg, "rect", {
      x: x - width / 2,
      y: y - height / 2,
      width,
      height,
      rx: 6,
      class: `direct-clutch${active ? " active" : ""}`,
    });
    addSvg(svg, "line", { x1: x - 15, y1: y, x2: x + 15, y2: y, class: `mesh-line${active ? " active" : ""}` });
    addSvg(svg, "text", { x, y: y + 5, class: "gear-text clutch-label" }, label);
  }

  function addReverseSet(svg, x, topY, lowerY, active, result, reverseTeeth, reverseLabels = null) {
    const spread = 34;
    addMeshLine(svg, x - spread, lowerY, x, 165, active);
    addMeshLine(svg, x, 165, x + spread, topY, active);
    const lowerTeeth = reverseTeeth.lower;
    const idlerTeeth = reverseTeeth.idler;
    const topTeeth = reverseTeeth.top;
    addRectGear(svg, x - spread, lowerY, 23, gearHeightForTeeth(lowerTeeth), gearToothLabel(reverseLabels.lower, lowerTeeth, "bottom"), result.countershaftRpm, active, active, "up");
    addRectGear(svg, x, 165, 23, gearHeightForTeeth(idlerTeeth), gearToothLabel(reverseLabels.idler, idlerTeeth, "right"), -result.countershaftRpm, active, active, "down");
    addRectGear(svg, x + spread, topY, 23, gearHeightForTeeth(topTeeth), gearToothLabel(reverseLabels.top, topTeeth, "top"), result.gearboxOutputRpm, active, active, "up");
  }

  function addGearMotionLines(group, x, y, width, height, rpm, direction) {
    const rectX = x - width / 2;
    const rectY = y - height / 2;
    const innerTop = rectY + 7;
    const innerBottom = rectY + height - 7;
    const span = Math.max(6, innerBottom - innerTop);
    const lineCount = Math.max(3, Math.ceil(span / 12));
    const startY = direction === "up" ? innerBottom : innerTop;
    const endY = direction === "up" ? innerTop : innerBottom;
    const shouldAnimate = Math.abs(Number(rpm) || 0) >= 0.1;
    const duration = visualPeriod(rpm, 1.64);
    const durationSeconds = Number.parseFloat(duration) || 1;
    const stripes = addSvg(group, "g", { class: `gear-motion-lines ${direction}` });

    for (let index = 0; index < lineCount; index += 1) {
      const stripeY = shouldAnimate ? startY : innerTop + (index / Math.max(lineCount - 1, 1)) * span;
      const line = addSvg(stripes, "line", {
        x1: rectX + 3,
        y1: stripeY,
        x2: rectX + width - 3,
        y2: stripeY,
        class: "gear-motion-line",
      });
      if (shouldAnimate) {
        const begin = `${-(durationSeconds * index) / lineCount}s`;
        const values = `${startY};${endY};${startY};${startY}`;
        const opacityValues = "1;1;0;0";
        const keyTimes = "0;0.9;0.9001;1";
        addSvg(line, "animate", { attributeName: "y1", values, keyTimes, dur: duration, begin, repeatCount: "indefinite" });
        addSvg(line, "animate", { attributeName: "y2", values, keyTimes, dur: duration, begin, repeatCount: "indefinite" });
        addSvg(line, "animate", { attributeName: "opacity", values: opacityValues, keyTimes, dur: duration, begin, repeatCount: "indefinite" });
      }
    }
  }

  function addMeshLine(svg, x1, y1, x2, y2, active) {
    addSvg(svg, "line", { x1, y1, x2, y2, class: `mesh-line${active ? " active" : ""}` });
  }

  function addPowerArrow(svg, x1, y1, x2, y2, rpm) {
    addSvg(svg, "line", { x1, y1, x2, y2, class: "power-arrow", style: shaftStyle(rpm) });
    addSvg(svg, "path", { d: `M${x2} ${y2} l-12 -7 l0 14 z`, class: "arrow-head" });
  }

  function drawSchematicDifferential(parent, result, labels, inputX, inputY, layout) {
    const blueScale = layout.blueScale || 1;
    const blueLayout = {
      ...layout,
      x: layout.x + (layout.width * (1 - blueScale)) / 2,
      y: layout.y + (layout.height * (1 - blueScale)) / 2,
      width: layout.width * blueScale,
      height: layout.height * blueScale,
    };
    const x = (ratio) => Math.round(blueLayout.x + blueLayout.width * ratio);
    const y = (ratio) => Math.round(blueLayout.y + blueLayout.height * ratio);
    const labelX = (ratio) => Math.round(layout.x + layout.width * ratio);
    const labelY = (ratio) => Math.round(layout.y + layout.height * ratio);
    const centerX = layout.wheelX + layout.wheelWidth / 2;
    const centerY = y(0.5);
    const blueShaftStyle = `${shaftStyle(result.averageWheelRpm)};stroke-width:${Math.round(14 * blueScale)}`;

    addPowerArrow(parent, inputX, inputY, x(0.02), centerY, result.gearboxOutputRpm);
    addSvg(parent, "line", {
      x1: centerX,
      y1: layout.topWheelY + layout.wheelHeight,
      x2: centerX,
      y2: y(0.22),
      class: "diff-main-shaft",
    });
    addSvg(parent, "line", {
      x1: centerX,
      y1: y(0.62),
      x2: centerX,
      y2: layout.bottomWheelY,
      class: "diff-main-shaft",
    });

    addSvg(parent, "line", { x1: x(0.23), y1: centerY, x2: x(0.30), y2: centerY, class: "diff-cross-shaft", style: blueShaftStyle });
    addSvg(parent, "line", { x1: x(0.70), y1: centerY, x2: x(0.76), y2: centerY, class: "diff-cross-shaft", style: blueShaftStyle });
    addSvg(parent, "rect", { x: x(0.15), y: y(0.26), width: x(0.23) - x(0.15), height: y(0.86) - y(0.26), class: "diff-blue-case diff-post" });
    addSvg(parent, "rect", { x: x(0.76), y: y(0.26), width: x(0.84) - x(0.76), height: y(0.86) - y(0.26), class: "diff-blue-case diff-post" });

    drawDifferentialGear(parent, "1", diffPolygon(blueLayout, [
      [0.10, 0.84],
      [0.10, 0.12],
      [0.01, 0.02],
      [0.01, 0.98],
    ]), result.averageWheelRpm, "horizontal-down");
    drawDifferentialGear(parent, "2", diffPolygon(blueLayout, [
      [0.98, 0.98],
      [0.90, 0.82],
      [0.10, 0.82],
      [0.01, 0.98],
    ]), result.averageWheelRpm, "vertical-left");
    drawDifferentialGear(parent, "3", diffPolygon(blueLayout, [
      [0.41, 0.36],
      [0.30, 0.22],
      [0.30, 0.74],
      [0.41, 0.60],
    ]), result.averageWheelRpm, "horizontal-down");
    drawDifferentialGear(parent, "4", diffPolygon(blueLayout, [
      [0.59, 0.36],
      [0.70, 0.22],
      [0.70, 0.74],
      [0.59, 0.60],
    ]), result.averageWheelRpm, "horizontal-down");
    drawDifferentialGear(parent, "5", diffPolygon(blueLayout, [
      [0.70, 0.74],
      [0.30, 0.74],
      [0.41, 0.60],
      [0.59, 0.60],
    ]), result.averageWheelRpm, "vertical-left");
    drawDifferentialGear(parent, "6", diffPolygon(blueLayout, [
      [0.70, 0.22],
      [0.30, 0.22],
      [0.41, 0.36],
      [0.59, 0.36],
    ]), result.averageWheelRpm, "vertical-left");

    if (labels.differential) {
      addSvg(parent, "text", { x: labelX(0.96), y: labelY(0.28), class: "svg-label center" }, labels.differential);
      addSvg(parent, "text", { x: labelX(0.96), y: labelY(0.40), class: "component-value" }, `${formatNumber(result.averageWheelRpm, 1)} rpm`);
    }
  }

  function diffPolygon(layout, ratios) {
    const points = ratios.map(([rx, ry]) => ({
      x: Math.round(layout.x + layout.width * rx),
      y: Math.round(layout.y + layout.height * ry),
    }));
    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    return {
      points: points.map((point) => `${point.x},${point.y}`).join(" "),
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  function drawDifferentialGear(parent, id, polygon, rpm, motion) {
    const clip = addSvg(parent, "clipPath", { id: `diff-gear-clip-${id}` });
    addSvg(clip, "polygon", { points: polygon.points });
    addSvg(parent, "polygon", { points: polygon.points, class: "differential-gear" });
    const motionGroup = addSvg(parent, "g", { "clip-path": `url(#diff-gear-clip-${id})` });
    addDifferentialGearMotionLines(motionGroup, polygon.x, polygon.y, polygon.width, polygon.height, rpm, motion);
  }

  function drawSchematicWheel(parent, x, y, width, height, label, labelY, rpm) {
    addSvg(parent, "rect", { x, y, width, height, rx: 2, class: "schematic-tire-rect" });
    addMovingWheelLines(parent, x, y, width, height, rpm);
    if (label) addSvg(parent, "text", { x: x + width / 2, y: labelY, class: "svg-label center" }, label);
  }

  function addMovingWheelLines(parent, x, y, width, height, rpm) {
    const count = 5;
    const left = x + 12;
    const right = x + width - 12;
    const shouldAnimate = Math.abs(Number(rpm) || 0) >= 0.1;
    const duration = visualPeriod(rpm, 1.2);
    const durationSeconds = Number.parseFloat(duration) || 1;
    for (let index = 0; index < count; index += 1) {
      const stripeX = shouldAnimate ? right : left + (index / Math.max(count - 1, 1)) * (right - left);
      const line = addSvg(parent, "line", { x1: stripeX, y1: y + 7, x2: stripeX, y2: y + height - 7, class: "wheel-long-line" });
      if (shouldAnimate) {
        const begin = `${-(durationSeconds * index) / count}s`;
        const values = `${right};${left};${right};${right}`;
        const opacityValues = "1;1;0;0";
        const keyTimes = "0;0.9;0.9001;1";
        addSvg(line, "animate", { attributeName: "x1", values, keyTimes, dur: duration, begin, repeatCount: "indefinite" });
        addSvg(line, "animate", { attributeName: "x2", values, keyTimes, dur: duration, begin, repeatCount: "indefinite" });
        addSvg(line, "animate", { attributeName: "opacity", values: opacityValues, keyTimes, dur: duration, begin, repeatCount: "indefinite" });
      }
    }
  }

  function addDifferentialGearMotionLines(parent, x, y, width, height, rpm, motion) {
    const shouldAnimate = Math.abs(Number(rpm) || 0) >= 0.1;
    const duration = visualPeriod(rpm, 1.45);
    const durationSeconds = Number.parseFloat(duration) || 1;
    const padding = 5;
    const left = x + padding;
    const right = x + width - padding;
    const top = y + padding;
    const bottom = y + height - padding;
    if (motion === "vertical-left") {
      const count = Math.max(3, Math.ceil(width / 16));
      for (let index = 0; index < count; index += 1) {
        const lineX = shouldAnimate ? right : right - (index / Math.max(count - 1, 1)) * Math.max(1, right - left);
        const line = addSvg(parent, "line", { x1: lineX, y1: top, x2: lineX, y2: bottom, class: "differential-gear-motion-line" });
        if (shouldAnimate) {
          const begin = `${-(durationSeconds * index) / count}s`;
          const values = `${right};${left};${right};${right}`;
          const opacityValues = "1;1;0;0";
          const keyTimes = "0;0.9;0.9001;1";
          addSvg(line, "animate", { attributeName: "x1", values, keyTimes, dur: duration, begin, repeatCount: "indefinite" });
          addSvg(line, "animate", { attributeName: "x2", values, keyTimes, dur: duration, begin, repeatCount: "indefinite" });
          addSvg(line, "animate", { attributeName: "opacity", values: opacityValues, keyTimes, dur: duration, begin, repeatCount: "indefinite" });
        }
      }
      return;
    }

    const count = Math.max(3, Math.ceil(height / 14));
    for (let index = 0; index < count; index += 1) {
      const lineY = shouldAnimate ? top : top + (index / Math.max(count - 1, 1)) * Math.max(1, bottom - top);
      const line = addSvg(parent, "line", { x1: left, y1: lineY, x2: right, y2: lineY, class: "differential-gear-motion-line" });
      if (shouldAnimate) {
        const begin = `${-(durationSeconds * index) / count}s`;
        const values = `${top};${bottom};${top};${top}`;
        const opacityValues = "1;1;0;0";
        const keyTimes = "0;0.9;0.9001;1";
        addSvg(line, "animate", { attributeName: "y1", values, keyTimes, dur: duration, begin, repeatCount: "indefinite" });
        addSvg(line, "animate", { attributeName: "y2", values, keyTimes, dur: duration, begin, repeatCount: "indefinite" });
        addSvg(line, "animate", { attributeName: "opacity", values: opacityValues, keyTimes, dur: duration, begin, repeatCount: "indefinite" });
      }
    }
  }

  function drawEngineCrank(parent, cx, cy, rpm, mirrorAxisX) {
    const root = Number.isFinite(mirrorAxisX)
      ? addSvg(parent, "g", { transform: `translate(${mirrorAxisX * 2} 0) scale(-1 1)` })
      : parent;
    const period = visualPeriod(rpm, 0.75);
    const shouldAnimate = Math.abs(Number(rpm) || 0) >= 0.1;
    const crankRadius = 13;
    const wristBaseX = cx + 30;
    const slide = 7;
    const values = {
      crankX: `${cx + crankRadius};${cx};${cx - crankRadius};${cx};${cx + crankRadius}`,
      crankY: `${cy};${cy + crankRadius};${cy};${cy - crankRadius};${cy}`,
      wristX: `${wristBaseX + slide};${wristBaseX};${wristBaseX - slide};${wristBaseX};${wristBaseX + slide}`,
    };

    addSvg(root, "rect", { x: cx + 20, y: cy - 15, width: 34, height: 30, rx: 4, class: "engine-cylinder" });
    addSvg(root, "circle", { cx, cy, r: 18, class: "engine-crank-case" });
    const rod = addSvg(root, "line", {
      x1: cx + crankRadius,
      y1: cy,
      x2: wristBaseX + slide,
      y2: cy,
      class: "engine-rod",
    });
    if (shouldAnimate) {
      addSvg(rod, "animate", { attributeName: "x1", values: values.crankX, dur: period, repeatCount: "indefinite" });
      addSvg(rod, "animate", { attributeName: "y1", values: values.crankY, dur: period, repeatCount: "indefinite" });
      addSvg(rod, "animate", { attributeName: "x2", values: values.wristX, dur: period, repeatCount: "indefinite" });
    }

    const piston = addSvg(root, "g", { class: "engine-piston-slide" });
    addSvg(piston, "rect", { x: wristBaseX - 2, y: cy - 10, width: 17, height: 20, rx: 3, class: "engine-piston" });
    addSvg(piston, "circle", { cx: wristBaseX + 1, cy, r: 2.5, class: "engine-pin" });
    if (shouldAnimate) {
      addSvg(piston, "animateTransform", {
        attributeName: "transform",
        type: "translate",
        values: `${slide} 0;0 0;${-slide} 0;0 0;${slide} 0`,
        dur: period,
        repeatCount: "indefinite",
      });
    }

    const crank = addSvg(root, "g", { class: "engine-crank" });
    addSvg(crank, "line", { x1: cx, y1: cy, x2: cx + crankRadius, y2: cy, class: "engine-crank-arm" });
    addSvg(crank, "circle", { cx: cx + crankRadius, cy, r: 4, class: "engine-pin" });
    if (shouldAnimate) {
      addSvg(crank, "animateTransform", {
        attributeName: "transform",
        type: "rotate",
        from: `0 ${cx} ${cy}`,
        to: `360 ${cx} ${cy}`,
        dur: period,
        repeatCount: "indefinite",
      });
    }
    addSvg(root, "circle", { cx, cy, r: 3.5, class: "engine-pin center" });
  }

  function gearToothLabel(label, teeth, position) {
    return {
      text: `${label}\n${teeth}${toothSuffix()}`,
      position,
    };
  }

  function toothSuffix() {
    return state.lang === "pt" ? " D" : " T";
  }

  function schematicGearNumbers(transmission) {
    const labels = {
      fixed: {},
      gears: {},
      reverse: null,
    };
    const forwardGears = transmission.gears.filter((gear) => gear.id !== "r");
    const reverse = transmission.gears.find((gear) => gear.id === "r");
    let nextNumber = 1;

    labels.fixed.top = String(nextNumber++);
    forwardGears.forEach((gear) => {
      labels.gears[gear.id] = { top: String(nextNumber++) };
    });
    if (reverse) {
      labels.reverse = { top: String(nextNumber++) };
    }

    labels.fixed.lower = String(nextNumber++);
    forwardGears.forEach((gear) => {
      if (gear.visualPath === "direct") return;
      labels.gears[gear.id].lower = String(nextNumber++);
    });
    if (reverse) {
      labels.reverse.lower = String(nextNumber++);
      labels.reverse.idler = String(nextNumber++);
    }

    return labels;
  }

  function gearHeightForTeeth(teeth) {
    return clamp(42 + Number(teeth) * 1.32, 50, 104);
  }

  function deriveSchematicTeeth(transmission) {
    const counterRatio = Math.abs(Number(transmission.counterRatio) || 0.5);
    const fixed = bestToothPair(counterRatio, { max: 50, preferredDriven: 46 });
    const gears = {};
    transmission.gears.forEach((gear) => {
      if (gear.id === "r" || gear.visualPath === "direct") return;
      gears[gear.id] = bestToothPair(Math.abs(Number(gear.ratio) || 1) * counterRatio, {
        max: 42,
        preferredDriven: 24,
      });
    });
    const reverse = transmission.gears.find((gear) => gear.id === "r");
    const reversePair = reverse
      ? bestToothPair(Math.abs(Number(reverse.ratio) || 1) * counterRatio, {
          max: 42,
          preferredDriven: 20,
        })
      : null;
    return {
      input: fixed.top,
      counter: fixed.lower,
      gears,
      reverse: reversePair
        ? {
            top: reversePair.top,
            lower: reversePair.lower,
            idler: clamp(Math.round((reversePair.top + reversePair.lower) / 2), 14, 34),
          }
        : null,
    };
  }

  function bestToothPair(targetRatio, options = {}) {
    const min = options.min || 12;
    const max = options.max || 42;
    const preferredDriven = options.preferredDriven || 24;
    let best = { top: min, lower: min, score: Number.POSITIVE_INFINITY };
    for (let lower = min; lower <= max; lower += 1) {
      for (let top = min; top <= max; top += 1) {
        const ratio = top / lower;
        const relativeError = Math.abs(ratio - targetRatio) / Math.max(targetRatio, 0.001);
        const score = relativeError * 100 + Math.abs(lower - preferredDriven) * 0.015 + Math.abs(top - lower) * 0.002;
        if (score < best.score) {
          best = { top, lower, score };
        }
      }
    }
    return { top: best.top, lower: best.lower };
  }

  function animate(timestamp) {
    if (currentResult && timestamp - lastVisualFrame > 16) {
      renderTopCar(currentResult, timestamp);
      lastVisualFrame = timestamp;
    }
    frameId = requestAnimationFrame(animate);
  }

  function renderTopCar(result, timestamp) {
    const svg = dom.topCarSvg;
    svg.replaceChildren();
    const cx = 230;
    const canvasCenterY = 344;
    const sceneScale = 1.04;
    const scene = addSvg(svg, "g", {
      transform: `translate(${cx} ${canvasCenterY}) scale(${sceneScale}) rotate(90) translate(${-cx} ${-canvasCenterY})`,
    });
    const curveSide = state.turnDirection === "left" ? 1 : -1;
    const carScale = 1;
    const imageWidth = 660 * carScale;
    const imageHeight = 284 * carScale;
    const cy = canvasCenterY;
    const frontX = cx - 184 * carScale;
    const rearX = cx + 176 * carScale;
    const trackPx = 188 * carScale;
    const wheelTrackPx = trackPx * 1.1;
    const radiusPx = result.curveEnabled ? curveRadiusPx(result, wheelTrackPx) : 0;
    const frontWheelX = frontX + 18 * carScale;
    const wheelScaleValue = wheelScale(result);
    const wheelSizeScale = 1.2;
    const wheelLength = 60 * wheelScaleValue * carScale * wheelSizeScale;
    const wheelWidth = 22 * wheelScaleValue * carScale * wheelSizeScale;
    const center = { x: rearX, y: cy + curveSide * radiusPx };
    const stripeSpeed = clamp(Math.abs(result.averageWheelRpm) * 0.36, 14, 180);
    const stripeOffset = positiveModulo((timestamp / 1000) * -stripeSpeed, wheelLength / 2);

    if (result.curveEnabled) {
      const baseAngle = curveSide > 0 ? 270 : 90;
      const arcSpan = (Math.asin(clamp(320 / radiusPx, 0.015, 0.95)) * 180) / Math.PI;
      addSvg(scene, "path", {
        d: circleArcPath(center.x, center.y, radiusPx, baseAngle - arcSpan, baseAngle + arcSpan),
        class: "road-guide curve-road",
      });
      addSvg(scene, "circle", { cx: center.x, cy: center.y, r: 7, class: "curve-center" });
      addSvg(scene, "text", { x: center.x + 12, y: center.y + 4, class: "svg-label" }, "R");
      addSvg(scene, "line", { x1: center.x, y1: center.y, x2: rearX, y2: cy, class: "radius-line" });
    }

    addSvg(scene, "image", {
      href: "assets/top.png",
      x: cx - imageWidth / 2,
      y: cy - imageHeight / 2,
      width: imageWidth,
      height: imageHeight,
      class: "car-line-art top-line-art",
      preserveAspectRatio: "xMidYMid meet",
    });

    const topFront = { x: frontWheelX, y: cy - wheelTrackPx / 2 };
    const bottomFront = { x: frontWheelX, y: cy + wheelTrackPx / 2 };
    const topFrontAngle = result.curveEnabled ? wheelPlaneAngleTowardCenter(topFront, center) : 0;
    const bottomFrontAngle = result.curveEnabled ? wheelPlaneAngleTowardCenter(bottomFront, center) : 0;
    const wheelPoints = [
      { ...topFront, angle: topFrontAngle, rear: false },
      { ...bottomFront, angle: bottomFrontAngle, rear: false },
      { x: rearX, y: cy - wheelTrackPx / 2, angle: 0, rear: true },
      { x: rearX, y: cy + wheelTrackPx / 2, angle: 0, rear: true },
    ];

    wheelPoints.forEach((wheel) => {
      if (result.curveEnabled && !wheel.rear) {
        addSvg(scene, "line", { x1: wheel.x, y1: wheel.y, x2: center.x, y2: center.y, class: "ackermann-line" });
      }
      drawTopWheel(scene, wheel.x, wheel.y, wheel.angle, wheelLength, wheelWidth, stripeOffset, wheel.rear);
    });

    const lowerTrackLeft = scenePointToViewport({ x: rearX, y: cy + wheelTrackPx / 2 }, cx, canvasCenterY, sceneScale);
    const lowerTrackRight = scenePointToViewport({ x: rearX, y: cy - wheelTrackPx / 2 }, cx, canvasCenterY, sceneScale);
    const carBottomY = canvasCenterY + (imageWidth / 2) * sceneScale;
    drawTrackDimension(svg, lowerTrackLeft.x, lowerTrackRight.x, Math.min(carBottomY + 14, 700));
  }

  function drawTopWheel(parent, x, y, angle, length, width, stripeOffset, rear) {
    const group = addSvg(parent, "g", { transform: `translate(${x} ${y}) rotate(${angle})`, class: `top-wheel${rear ? " rear-wheel" : " front-wheel"}` });
    addSvg(group, "rect", { x: -length / 2, y: -width / 2, width: length, height: width, rx: 5, class: "wheel-rubber" });
    const spacing = length / 4;
    for (let xLine = -length + stripeOffset; xLine <= length; xLine += spacing) {
      if (xLine < -length / 2 + 4 || xLine > length / 2 - 4) continue;
      addSvg(group, "line", {
        x1: xLine,
        y1: -width * 0.34,
        x2: xLine,
        y2: width * 0.34,
        class: "wheel-mark",
      });
    }
  }

  function scenePointToViewport(point, originX, originY, scale) {
    return {
      x: originX - (point.y - originY) * scale,
      y: originY + (point.x - originX) * scale,
    };
  }

  function drawTrackDimension(parent, x1, x2, y) {
    const left = Math.min(x1, x2);
    const right = Math.max(x1, x2);
    const centerX = (left + right) / 2;
    const group = addSvg(parent, "g", { class: "track-dimension", "aria-hidden": "true" });
    addSvg(group, "line", { x1: left, y1: y, x2: right, y2: y, class: "track-dimension-line" });
    addSvg(group, "line", { x1: left, y1: y - 30, x2: left, y2: y + 30, class: "track-dimension-line" });
    addSvg(group, "line", { x1: right, y1: y - 30, x2: right, y2: y + 30, class: "track-dimension-line" });
    addSvg(group, "text", { x: centerX, y: y + 46, class: "track-dimension-label" }, "L");
  }

  function addSvg(parent, name, attrs = {}, text) {
    const node = document.createElementNS(svgNS, name);
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
    if (text !== undefined) node.textContent = text;
    parent.append(node);
    return node;
  }

  function addSvgMultilineText(parent, x, y, text, className) {
    const node = addSvg(parent, "text", { x, y, class: className });
    String(text)
      .split("\n")
      .forEach((line, index) => {
        const tspan = addSvg(node, "tspan", { x, dy: index === 0 ? 0 : 15 });
        tspan.textContent = line;
      });
    return node;
  }

  function angleForValue(value, max) {
    return GAUGE_MIN_ANGLE + (GAUGE_MAX_ANGLE - GAUGE_MIN_ANGLE) * clamp(value / max, 0, 1);
  }

  function polarToCartesian(cx, cy, radius, angleDeg) {
    const angleRad = ((angleDeg - 90) * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(angleRad),
      y: cy + radius * Math.sin(angleRad),
    };
  }

  function describeArc(cx, cy, radius, startAngle, endAngle) {
    const start = polarToCartesian(cx, cy, radius, endAngle);
    const end = polarToCartesian(cx, cy, radius, startAngle);
    const largeArcFlag = Math.abs(endAngle - startAngle) <= 180 ? "0" : "1";
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
  }

  function circleArcPath(cx, cy, radius, startAngleDeg, endAngleDeg) {
    const startAngle = (startAngleDeg * Math.PI) / 180;
    const endAngle = (endAngleDeg * Math.PI) / 180;
    const start = {
      x: cx + Math.cos(startAngle) * radius,
      y: cy + Math.sin(startAngle) * radius,
    };
    const end = {
      x: cx + Math.cos(endAngle) * radius,
      y: cy + Math.sin(endAngle) * radius,
    };
    const largeArcFlag = Math.abs(endAngleDeg - startAngleDeg) > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
  }

  function angleToward(from, to) {
    return (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;
  }

  function wheelPlaneAngleTowardCenter(from, to) {
    return normalizeAxialAngle(angleToward(from, to) - 90);
  }

  function normalizeAxialAngle(angle) {
    return positiveModulo(angle + 90, 180) - 90;
  }

  function wheelScale(result) {
    return clamp(0.72 + (Number(result.wheelDiameterCm) - 45) / 70, 0.72, 1.45);
  }

  function curveRadiusPx(result, visualTrackPx) {
    return visualTrackPx * curveToTrackRatio(result);
  }

  function curveToTrackRatio(result) {
    const radius = Math.max(Number(result.radiusM) || 1, 0.1);
    const track = Math.max(Number(result.trackWidthM) || 1.3, 0.1);
    return radius / track;
  }

  function shaftStyle(rpm) {
    return `animation-duration:${visualPeriod(rpm)};animation-direction:${rpm < 0 ? "reverse" : "normal"}`;
  }

  function visualPeriod(rpm, multiplier = 1) {
    const value = Math.abs(Number(rpm) || 0);
    if (value < 0.1) return `${6 * multiplier}s`;
    const visualRps = Math.min(3.2, Math.max(0.18, value / 760));
    return `${(multiplier / visualRps).toFixed(2)}s`;
  }

  function formatNumber(value, digits = 1) {
    return new Intl.NumberFormat(localeByLang[state.lang], {
      maximumFractionDigits: digits,
      minimumFractionDigits: digits,
    }).format(Number(value) || 0);
  }

  function roundTo(value, digits) {
    const factor = 10 ** digits;
    return Math.round(value * factor) / factor;
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(Number(value) || 0, min), max);
  }

  function positiveModulo(value, modulus) {
    return ((value % modulus) + modulus) % modulus;
  }

  function setText(id, value) {
    dom[id].textContent = value;
  }

  function t(key) {
    return i18n[state.lang][key] || key;
  }

  window.addEventListener("beforeunload", () => {
    if (frameId) cancelAnimationFrame(frameId);
  });
})();
