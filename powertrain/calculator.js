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
      teeth: {
        input: 29,
        counter: 50,
        gears: {
          1: { top: 35, lower: 17 },
          2: { top: 26, lower: 23 },
          3: { top: 18, lower: 24 },
          5: { top: 13, lower: 28 },
        },
        reverse: { top: 25, lower: 13, idler: 19 },
      },
      source: "preset",
      gears: [
        { id: "r", label: "R", visualPath: "reverse" },
        { id: "1", label: "1", visualPath: "first" },
        { id: "2", label: "2", visualPath: "second" },
        { id: "3", label: "3", visualPath: "third" },
        { id: "4", label: "4", visualPath: "direct" },
        { id: "5", label: "5", visualPath: "overdrive" },
      ],
    },
    {
      id: "sport-6",
      name: { pt: "Esportivo 6 marchas", en: "Sport 6-speed" },
      note: {
        pt: "Marchas próximas, com 6ª para velocidade final/consumo.",
        en: "Close ratios, with 6th for top speed or economy.",
      },
      teeth: {
        input: 32,
        counter: 50,
        gears: {
          1: { top: 41, lower: 20 },
          2: { top: 39, lower: 29 },
          3: { top: 36, lower: 37 },
          4: { top: 16, lower: 21 },
          6: { top: 21, lower: 40 },
        },
        reverse: { top: 31, lower: 13, idler: 22 },
      },
      source: "preset",
      gears: [
        { id: "r", label: "R", visualPath: "reverse" },
        { id: "1", label: "1", visualPath: "first" },
        { id: "2", label: "2", visualPath: "second" },
        { id: "3", label: "3", visualPath: "third" },
        { id: "4", label: "4", visualPath: "fourth" },
        { id: "5", label: "5", visualPath: "direct" },
        { id: "6", label: "6", visualPath: "overdrive" },
      ],
    },
    {
      id: "heavy-4",
      name: { pt: "Carga 4 marchas", en: "Heavy-duty 4-speed" },
      note: {
        pt: "Redução curta para arrancada e carga.",
        en: "Short reduction for launch and load.",
      },
      teeth: {
        input: 23,
        counter: 46,
        gears: {
          1: { top: 41, lower: 20 },
          2: { top: 37, lower: 31 },
          3: { top: 29, lower: 39 },
        },
        reverse: { top: 33, lower: 15, idler: 24 },
      },
      source: "preset",
      gears: [
        { id: "r", label: "R", visualPath: "reverse" },
        { id: "1", label: "1", visualPath: "first" },
        { id: "2", label: "2", visualPath: "second" },
        { id: "3", label: "3", visualPath: "third" },
        { id: "4", label: "4", visualPath: "direct" },
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

  function positiveNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? number : null;
  }

  function countershaftRatio(transmission) {
    const teeth = transmission.teeth || {};
    const inputTeeth = positiveNumber(teeth.input);
    const counterTeeth = positiveNumber(teeth.counter);
    if (inputTeeth && counterTeeth) return -(inputTeeth / counterTeeth);
    return Number(transmission.counterRatio || -0.5);
  }

  function gearRatio(transmission, gear) {
    if (gear.visualPath === "direct") return 1;

    // i = (output gear teeth / countershaft gear teeth) / (input gear teeth / countershaft fixed gear teeth).
    const fixedRatio = Math.abs(countershaftRatio(transmission));
    const teeth = transmission.teeth || {};
    const pair = gear.id === "r" ? teeth.reverse : teeth.gears && teeth.gears[gear.id];
    const topTeeth = positiveNumber(pair && pair.top);
    const lowerTeeth = positiveNumber(pair && pair.lower);

    if (fixedRatio > 0 && topTeeth && lowerTeeth) {
      const reduction = (topTeeth / lowerTeeth) / fixedRatio;
      return gear.id === "r" ? -reduction : reduction;
    }

    return Number(gear.ratio || 1);
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
    const ratio = gearRatio(transmission, gear);
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
      countershaftRatio: countershaftRatio(transmission),
      differentialRatio,
      wheelDiameterCm,
      wheelCircumferenceM: wheelCircumferenceMeters(wheelDiameterCm),
      engineRpm,
      countershaftRpm: engineRpm * countershaftRatio(transmission),
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
        ratio: result.ratio,
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
    countershaftRatio,
    gearRatio,
    signedWheelRpmFromSpeedKmh,
    signedSpeedKmhFromWheelRpm,
    wheelCircumferenceMeters,
  };
});
