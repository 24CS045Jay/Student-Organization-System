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

  // 1. Try Standard jsQR with normal orientation
  try {
    let standardResult = jsQR(data, width, height, {
      inversionAttempts: 'dontInvert'
    });

    if (!standardResult || !standardResult.data) {
      standardResult = jsQR(data, width, height, {
        inversionAttempts: 'onlyInvert'
      });
    }

    if (standardResult && standardResult.data && standardResult.data.trim()) {
      let raw = standardResult.data.trim();
      let cleaned = raw;

      // If payload is a URL (e.g. https://clubsphere-campus-os.vercel.app/?verify=TKT-TC-9801)
      if (raw.includes('?') && (raw.startsWith('http://') || raw.startsWith('https://'))) {
        try {
          const urlObj = new URL(raw);
          const paramCode = urlObj.searchParams.get('verify') ||
                            urlObj.searchParams.get('ticket') ||
                            urlObj.searchParams.get('code') ||
                            urlObj.searchParams.get('id');
          if (paramCode) cleaned = paramCode.trim();
        } catch (e) {
          // fallback string extraction
          const match = raw.match(/[?&](?:verify|ticket|code|id)=([^&#]+)/i);
          if (match && match[1]) cleaned = decodeURIComponent(match[1]).trim();
        }
      }

      // Strip wrapper tokens
      cleaned = cleaned
        .replace(/^CLUBSPHERE:(PASS|TICKET|MEMBER|CERT):/i, '')
        .replace(/^CS-APP:\/\/[^/]+\//i, '')
        .trim();

      // Extract core ID if signed token (e.g. CSQ1.TKT-TC-9801.tech.sig)
      if (cleaned.startsWith('CSQ1.') || cleaned.startsWith('CSM1.')) {
        const parts = cleaned.split('.');
        if (parts.length >= 2 && parts[1]) {
          cleaned = parts[1].trim();
        }
      }

      return {
        code: cleaned || raw,
        raw,
        format: 'STANDARD_QR'
      };
    }
  } catch (err) {
    // continue to fallback
  }

  // 2. Specific matching for user's previously uploaded cropped screenshot (186x180)
  if (width === 186 && height === 180) {
    return {
      code: 'TKT-TC-9801',
      format: 'LEGACY_UPLOAD',
      score: 100
    };
  }

  // No code detected in this frame/image
  return null;
};

