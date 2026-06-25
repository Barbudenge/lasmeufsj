(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.CarPhysics = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  const TRANSMISSIONS = [
    {
      id: "city-5",
      name: { pt: "Urbano 5 marchas", en: "City 5-speed" },
      note: {
        pt: "Conjunto didático com 5ª alongada para cruzeiro.",
        en: "Teaching preset with a tall 5th gear for cruising.",
      },
      counterRatio: -0.58,
      source: "preset",
      gears: [
        { id: "r", label: "R", ratio: -3.31, visualPath: "reverse" },
        { id: "1", label: "1", ratio: 3.55, visualPath: "first" },
        { id: "2", label: "2", ratio: 1.95, visualPath: "second" },
        { id: "3", label: "3", ratio: 1.3, visualPath: "third" },
        { id: "4", label: "4", ratio: 1, visualPath: "direct" },
        { id: "5", label: "5", ratio: 0.8, visualPath: "overdrive" },
      ],
    },
    {
      id: "sport-6",
      name: { pt: "Esportivo 6 marchas", en: "Sport 6-speed" },
      note: {
        pt: "Marchas próximas, com 6ª para velocidade final/consumo.",
        en: "Close ratios, with 6th for top speed or economy.",
      },
      counterRatio: -0.64,
      source: "preset",
      gears: [
        { id: "r", label: "R", ratio: -3.73, visualPath: "reverse" },
        { id: "1", label: "1", ratio: 3.2, visualPath: "first" },
        { id: "2", label: "2", ratio: 2.1, visualPath: "second" },
        { id: "3", label: "3", ratio: 1.52, visualPath: "third" },
        { id: "4", label: "4", ratio: 1.19, visualPath: "fourth" },
        { id: "5", label: "5", ratio: 1, visualPath: "direct" },
        { id: "6", label: "6", ratio: 0.82, visualPath: "overdrive" },
      ],
    },
    {
      id: "heavy-4",
      name: { pt: "Carga 4 marchas", en: "Heavy-duty 4-speed" },
      note: {
        pt: "Redução curta para arrancada e carga.",
        en: "Short reduction for launch and load.",
      },
      counterRatio: -0.5,
      source: "preset",
      gears: [
        { id: "r", label: "R", ratio: -4.4, visualPath: "reverse" },
        { id: "1", label: "1", ratio: 4.1, visualPath: "first" },
        { id: "2", label: "2", ratio: 2.39, visualPath: "second" },
        { id: "3", label: "3", ratio: 1.49, visualPath: "third" },
        { id: "4", label: "4", ratio: 1, visualPath: "direct" },
      ],
    },
  ];

  const WHEEL_PRESETS = [
    { id: "compact", diameterCm: 55, label: { pt: "Compacta 55 cm", en: "Compact 55 cm" } },
    { id: "suv", diameterCm: 72, label: { pt: "SUV 72 cm", en: "SUV 72 cm" } },
    { id: "truck", diameterCm: 82, label: { pt: "Carga 82 cm", en: "Truck 82 cm" } },
  ];

  function getTransmission(id) {
    return TRANSMISSIONS.find((item) => item.id === id) || TRANSMISSIONS[0];
  }

  function getGear(transmission, gearId) {
    return transmission.gears.find((item) => item.id === gearId) || transmission.gears[0];
  }

  function wheelCircumferenceMeters(diameterCm) {
    return Math.PI * (Number(diameterCm) / 100);
  }

  function signedWheelRpmFromSpeedKmh(speedKmh, diameterCm) {
    const metersPerMinute = (Number(speedKmh) * 1000) / 60;
    return metersPerMinute / wheelCircumferenceMeters(diameterCm);
  }

  function signedSpeedKmhFromWheelRpm(wheelRpm, diameterCm) {
    const metersPerMinute = Number(wheelRpm) * wheelCircumferenceMeters(diameterCm);
    return (metersPerMinute * 60) / 1000;
  }

  function clampRadius(radiusM, trackWidthM) {
    return Math.max(Number(radiusM) || 0, (Number(trackWidthM) || 0) / 2, 0.2);
  }

  function calculate(state) {
    const transmission = getTransmission(state.transmissionId);
    const gear = getGear(transmission, state.gearId);
    const ratio = Number(gear.ratio);
    const differentialRatio = Math.max(Number(state.differentialRatio) || 1, 0.01);
    const wheelDiameterCm = Math.max(Number(state.wheelDiameterCm) || 1, 1);
    const trackWidthM = Math.max(Number(state.trackWidthM) || 0, 0);
    const radiusM = clampRadius(state.radiusM, trackWidthM);
    const inputValue = Math.max(Number(state.inputValue) || 0, 0);
    const directionSign = ratio < 0 ? -1 : 1;

    let engineRpm;
    let gearboxOutputRpm;
    let averageWheelRpm;
    let vehicleSpeedKmh;

    if (state.inputMode === "vehicle") {
      averageWheelRpm = signedWheelRpmFromSpeedKmh(inputValue, wheelDiameterCm) * directionSign;
      gearboxOutputRpm = averageWheelRpm * differentialRatio;
      engineRpm = Math.abs(gearboxOutputRpm * ratio);
      vehicleSpeedKmh = signedSpeedKmhFromWheelRpm(averageWheelRpm, wheelDiameterCm);
    } else {
      engineRpm = inputValue;
      gearboxOutputRpm = ratio === 0 ? 0 : engineRpm / ratio;
      averageWheelRpm = gearboxOutputRpm / differentialRatio;
      vehicleSpeedKmh = signedSpeedKmhFromWheelRpm(averageWheelRpm, wheelDiameterCm);
    }

    const curveEnabled = state.motion === "curve";
    let leftFactor = 1;
    let rightFactor = 1;
    let innerRadiusM = radiusM;
    let outerRadiusM = radiusM;

    if (curveEnabled) {
      innerRadiusM = Math.max(radiusM - trackWidthM / 2, 0);
      outerRadiusM = radiusM + trackWidthM / 2;
      if (state.turnDirection === "right") {
        rightFactor = innerRadiusM / radiusM;
        leftFactor = outerRadiusM / radiusM;
      } else {
        leftFactor = innerRadiusM / radiusM;
        rightFactor = outerRadiusM / radiusM;
      }
    }

    const leftWheelSpeedKmh = vehicleSpeedKmh * leftFactor;
    const rightWheelSpeedKmh = vehicleSpeedKmh * rightFactor;
    const leftWheelRpm = signedWheelRpmFromSpeedKmh(leftWheelSpeedKmh, wheelDiameterCm);
    const rightWheelRpm = signedWheelRpmFromSpeedKmh(rightWheelSpeedKmh, wheelDiameterCm);
    const wheelbaseM = Math.max(Number(state.wheelbaseM) || 2.6, 0.1);
    const steeringAngleDeg = curveEnabled ? (Math.atan(wheelbaseM / radiusM) * 180) / Math.PI : 0;

    return {
      transmission,
      gear,
      ratio,
      differentialRatio,
      wheelDiameterCm,
      wheelCircumferenceM: wheelCircumferenceMeters(wheelDiameterCm),
      engineRpm,
      countershaftRpm: engineRpm * Number(transmission.counterRatio || -0.5),
      gearboxOutputRpm,
      differentialInputRpm: gearboxOutputRpm,
      averageWheelRpm,
      leftWheelRpm,
      rightWheelRpm,
      vehicleSpeedKmh,
      leftWheelSpeedKmh,
      rightWheelSpeedKmh,
      radiusM,
      innerRadiusM,
      outerRadiusM,
      trackWidthM,
      steeringAngleDeg,
      directionSign,
      curveEnabled,
    };
  }

  function calculateGearTable(state) {
    const transmission = getTransmission(state.transmissionId);
    return transmission.gears.map((gear) => {
      const result = calculate({ ...state, gearId: gear.id });
      return {
        gear,
        ratio: gear.ratio,
        engineRpm: result.engineRpm,
        vehicleSpeedKmh: result.vehicleSpeedKmh,
        gearboxOutputRpm: result.gearboxOutputRpm,
        averageWheelRpm: result.averageWheelRpm,
      };
    });
  }

  return {
    TRANSMISSIONS,
    WHEEL_PRESETS,
    calculate,
    calculateGearTable,
    getTransmission,
    getGear,
    signedWheelRpmFromSpeedKmh,
    signedSpeedKmhFromWheelRpm,
    wheelCircumferenceMeters,
  };
});
