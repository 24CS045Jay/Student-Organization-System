// ==============================================================================
// ClubSphere Proprietary Neo-Matrix 2D Barcode Engine
// Exclusive in-app barcode system: Cannot be scanned by external standard QR apps
// ==============================================================================

import jsQR from 'jsqr';
import { dbInstance } from '../mock/db.js';

export const getHash = (str) => {
  let hash = 0;
  const clean = String(str || '').trim().toUpperCase();
  for (let i = 0; i < clean.length; i++) {
    hash = (hash << 5) - hash + clean.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

/**
 * Generates the proprietary 11x11 ClubSphere Neo-Matrix
 */
export const generateNeoMatrix = (code = 'TC-001', gridSize = 11) => {
  const hash = getHash(code);
  const matrix = [];

  for (let r = 0; r < gridSize; r++) {
    const row = [];
    for (let c = 0; c < gridSize; c++) {
      // 3 Corner Alignment Markers (Standard Neo look)
      if ((r < 3 && c < 3) || (r < 3 && c > gridSize - 4) || (r > gridSize - 4 && c < 3)) {
        if ((r === 1 && c === 1) || (r === 1 && c === gridSize - 2) || (r === gridSize - 2 && c === 1)) {
          row.push(0);
        } else {
          row.push(1);
        }
      } else {
        // Proprietary bit dispersion algorithm
        const bit = ((hash ^ (r * 19 + c * 31)) % 100) > 42 ? 1 : 0;
        row.push(bit);
      }
    }
    matrix.push(row);
  }
  return matrix;
};

/**
 * Collects all candidate codes currently known to the platform
 */
export const getAllSystemCandidates = () => {
  const list = new Set([
    'TKT-TC-9801',
    'TKT-TC-9802',
    'TKT-TC-9803',
    'TKT-TC-9800',
    'TKT-CC-401',
    'TC-001',
    'TC-002',
    'TC-003',
    'CC-001',
    '24CS045',
    '24CS015',
    '24CS001',
    '24IT012',
    '24IT005'
  ]);

  try {
    if (dbInstance && dbInstance.data && dbInstance.data.clubs) {
      Object.values(dbInstance.data.clubs).forEach(club => {
        (club.tickets || []).forEach(t => {
          if (t.id) list.add(t.id.toUpperCase());
          if (t.memberId) list.add(t.memberId.toUpperCase());
          if (t.studentId) list.add(t.studentId.toUpperCase());
        });
        (club.members || []).forEach(m => {
          if (m.id) list.add(m.id.toUpperCase());
          if (m.studentId) list.add(m.studentId.toUpperCase());
        });
      });
    }
  } catch (e) {
    // fallback to default list
  }

  return Array.from(list);
};

/**
 * Universal In-App Scanner Decoder
 * Tries:
 * 1. Proprietary Neo-Matrix grid sampling
 * 2. jsQR standard QR fallback
 */
export const decodeInAppQR = (imageData) => {
  if (!imageData || !imageData.data || imageData.width === 0 || imageData.height === 0) {
    return null;
  }

  const { data, width, height } = imageData;

  // 1. Try Standard jsQR first if present
  try {
    const standardResult = jsQR(data, width, height, {
      inversionAttempts: 'dontInvert'
    });
    if (standardResult && standardResult.data && standardResult.data.trim()) {
      return {
        code: standardResult.data.trim(),
        format: 'STANDARD_QR'
      };
    }
  } catch (err) {
    // continue to proprietary decoder
  }

  // 2. Decode ClubSphere Proprietary Neo-Matrix
  // Locate dark bounding box of the code matrix
  let minX = width;
  let maxX = 0;
  let minY = height;
  let maxY = 0;
  let darkPixelCount = 0;

  // Scan luminance to find bounds
  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;

      if (brightness < 120) {
        darkPixelCount++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  // If no significant dark pixels found, not a code
  if (darkPixelCount < 40 || maxX <= minX || maxY <= minY) {
    return null;
  }

  // Adjust for potential margins / padding
  const boxW = maxX - minX;
  const boxH = maxY - minY;
  if (boxW < 20 || boxH < 20) return null;

  // Sample 11x11 grid from bounding box
  const gridSize = 11;
  const cellW = boxW / gridSize;
  const cellH = boxH / gridSize;
  const sampledGrid = [];

  for (let r = 0; r < gridSize; r++) {
    const row = [];
    for (let c = 0; c < gridSize; c++) {
      // Sample center 3x3 of this cell
      const cx = Math.floor(minX + (c + 0.5) * cellW);
      const cy = Math.floor(minY + (r + 0.5) * cellH);

      let darkVotes = 0;
      let totalSamples = 0;

      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const sx = Math.min(width - 1, Math.max(0, cx + dx));
          const sy = Math.min(height - 1, Math.max(0, cy + dy));
          const pIdx = (sy * width + sx) * 4;
          const pb = (data[pIdx] * 299 + data[pIdx + 1] * 587 + data[pIdx + 2] * 114) / 1000;
          if (pb < 135) darkVotes++;
          totalSamples++;
        }
      }

      row.push(darkVotes > (totalSamples / 2) ? 1 : 0);
    }
    sampledGrid.push(row);
  }

  // Compare sampled grid against candidate codes
  const candidates = getAllSystemCandidates();
  let bestCandidate = null;
  let highestScore = -1;

  for (const cand of candidates) {
    const candMatrix = generateNeoMatrix(cand, gridSize);
    let matchScore = 0;

    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        if (candMatrix[r][c] === sampledGrid[r][c]) {
          matchScore++;
        }
      }
    }

    if (matchScore > highestScore) {
      highestScore = matchScore;
      bestCandidate = cand;
    }
  }

  // 121 cells total. If score >= 105 (over 86% match), we found the exact match!
  if (highestScore >= 105 && bestCandidate) {
    return {
      code: bestCandidate,
      format: 'NEO_MATRIX',
      score: highestScore
    };
  }

  // Fallback: If close match (e.g. 95+), and candidate has high score
  if (highestScore >= 95 && bestCandidate) {
    return {
      code: bestCandidate,
      format: 'NEO_MATRIX',
      score: highestScore
    };
  }

  return null;
};
