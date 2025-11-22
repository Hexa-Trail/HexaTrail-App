// ------- utilitaires géométriques -------

function rotateLocal(localPt, angleRad) {
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  return {
    x: cos * localPt.x - sin * localPt.y,
    y: sin * localPt.x + cos * localPt.y,
  };
}

function distance(p1, p2) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Construit un solveur monopivot : stroke_amorto -> course curviligne de la roue
 *
 * @param {Object} geom  Géométrie en mm dans le repère de l'image
 * @param {Object} geom.mainPivot
 * @param {Object} geom.rearAxle
 * @param {Object} geom.shockOnFrame
 * @param {Object} geom.shockOnSwingarm
 *
 * @param {Object} options
 * @param {number} options.qMinDeg   Angle interne min (deg) autour de la pos de référence
 * @param {number} options.qMaxDeg   Angle interne max (deg)
 * @param {number} options.nSamples  Nb d'échantillons sur [qMin, qMax]
 *
 * @returns {Object} {
 *   shockStrokeToWheelArc: (stroke) => wheelArc,
 *   samples: [{qDeg, stroke, wheelArc, axle:{x,y}, shockLength}],
 *   strokeMin, strokeMax
 * }
 */
export function buildMonopivotShockToWheelSolver(geom, options = {}) {
  const {
    mainPivot,
    rearAxle,
    shockOnFrame,
    shockOnSwingarm,
  } = geom;

  const {
    qMinDeg = -5,   // à ajuster selon la cinématique et la photo
    qMaxDeg = 55,   // idem
    nSamples = 80,
  } = options;

  if (nSamples < 3) {
    throw new Error("nSamples doit être >= 3");
  }

  // Vecteurs locaux par rapport au pivot principal, dans la config de référence
  const axleLocal0 = {
    x: rearAxle.x - mainPivot.x,
    y: rearAxle.y - mainPivot.y,
  };

  const shockLocal0 = {
    x: shockOnSwingarm.x - mainPivot.x,
    y: shockOnSwingarm.y - mainPivot.y,
  };

  // Échantillonnage de q en rad
  const qDeg = [];
  const qRad = [];
  const dqDeg = (qMaxDeg - qMinDeg) / (nSamples - 1);

  for (let i = 0; i < nSamples; i++) {
    const aDeg = qMinDeg + i * dqDeg;
    const aRad = (aDeg * Math.PI) / 180.0;
    qDeg.push(aDeg);
    qRad.push(aRad);
  }

  // Calcul des positions, longueurs d'amorto, etc.
  const axleWorld = [];
  const shockLen = [];

  for (let i = 0; i < nSamples; i++) {
    const q = qRad[i];

    const axleRot = rotateLocal(axleLocal0, q);
    const shockRot = rotateLocal(shockLocal0, q);

    const axlePos = {
      x: mainPivot.x + axleRot.x,
      y: mainPivot.y + axleRot.y,
    };

    const shockLower = {
      x: mainPivot.x + shockRot.x,
      y: mainPivot.y + shockRot.y,
    };

    axleWorld.push(axlePos);
    shockLen.push(distance(shockOnFrame, shockLower));
  }

  // Etat de référence = iRef (ici on prend q=0 le plus proche)
  let iRef = 0;
  let bestAbs = Infinity;
  for (let i = 0; i < nSamples; i++) {
    const absQ = Math.abs(qRad[i]);
    if (absQ < bestAbs) {
      bestAbs = absQ;
      iRef = i;
    }
  }

  const L0 = shockLen[iRef];

  // Course d'amorto (stroke) : compression = L0 - L(q)
  const stroke = shockLen.map((L) => L0 - L);

  // Course curviligne de la roue le long de sa trajectoire
  const wheelArc = new Array(nSamples);
  wheelArc[0] = 0;

  for (let i = 1; i < nSamples; i++) {
    const ds = distance(axleWorld[i], axleWorld[i - 1]);
    wheelArc[i] = wheelArc[i - 1] + ds;
  }

  // Vérification "grossière" de la monotonie de la course d'amorto
  let increasing = 0;
  let decreasing = 0;
  for (let i = 1; i < nSamples; i++) {
    if (stroke[i] > stroke[i - 1]) increasing++;
    if (stroke[i] < stroke[i - 1]) decreasing++;
  }
  if (increasing > 0 && decreasing > 0) {
    console.warn(
      "[MonopivotSolver] stroke non monotone sur la plage choisie. " +
      "Vérifie qMin/qMax ou la géométrie."
    );
  }

  const strokeMin = Math.min(...stroke);
  const strokeMax = Math.max(...stroke);

  // Pour debug / affichage
  const samples = [];
  for (let i = 0; i < nSamples; i++) {
    samples.push({
      qDeg: qDeg[i],
      stroke: stroke[i],
      wheelArc: wheelArc[i],
      axle: axleWorld[i],
      shockLength: shockLen[i],
    });
  }

  /**
   * Interpolation linéaire stroke -> wheelArc
   * @param {number} strokeVal  course d'amorto en mm (par rapport à la ref L0)
   * @returns {number} course curviligne roue en mm
   */
  function shockStrokeToWheelArc(strokeVal) {
    // Gestion des valeurs hors plage : on sature à min/max
    if (strokeVal <= strokeMin) {
      // Extrapolation linéaire ou simple clamp. Ici on clamp :
      return wheelArc[stroke.indexOf(strokeMin)];
    }
    if (strokeVal >= strokeMax) {
      return wheelArc[stroke.indexOf(strokeMax)];
    }

    // Recherche du bon intervalle (scan simple, nSamples reste petit)
    let i = 0;
    while (i < nSamples - 1 && stroke[i + 1] < strokeVal) {
      i++;
    }

    // Intervalle [i, i+1]
    const s0 = stroke[i];
    const s1 = stroke[i + 1];
    const w0 = wheelArc[i];
    const w1 = wheelArc[i + 1];

    const t = (strokeVal - s0) / (s1 - s0); // [0,1]
    return w0 + t * (w1 - w0);
  }

  return {
    shockStrokeToWheelArc,
    samples,
    strokeMin,
    strokeMax,
  };
}
