import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Enable CORS for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// ============================================================================
// BASE DE DONNEES MYSQL "loarc" SIMULEE AVEC RELATIONS STRICTES (Section 12)
// Tables:
// 1. ECHANTILLON (code_ech, num_produit, code_facture)
// 2. FACTURE (code_fact, date_fact, num_fact, montant_fact)
// 3. DETAIL_FACTURE (code_details, code_fact, code_ech)
// ============================================================================

interface Facture {
  code_fact: string;
  date_fact: string;
  num_fact: string;
  montant_fact: number;
}

interface Echantillon {
  code_ech: string;
  num_produit: string;
  code_facture: string;
}

interface DetailFacture {
  code_details: number;
  code_fact: string;
  code_ech: string;
}

const PRODUITS = [
  'P-101', // Hémogramme Complet & NFS
  'P-102', // Biochimie Sérique (Urée, Créat, Glycémie)
  'P-203', // Ionogramme Sanguin
  'P-205', // Sérologie Virale (Hépatites, VIH)
  'P-301', // Microbiologie & Bactériologie
  'P-305', // Toxicologie Clinique
  'P-402', // Hormonologie & Thyroïde
  'P-408', // Marqueurs Cardiaques (Troponine)
  'P-501', // Gazométrie Artérielle
  'P-510', // Marqueurs Tumoraux
];

// Seed realistic laboratory database
const factures: Facture[] = [];
const echantillons: Echantillon[] = [];
const detailsFacture: DetailFacture[] = [];

let detailCounter = 1;
let sampleCounter = 1;

// Dates generating over 2024 and 2025 across multiple weeks and months
const sampleDates = [
  // 2024 Q1
  '2024-01-08', '2024-01-12', '2024-01-15', '2024-01-19', '2024-01-24', '2024-01-29',
  '2024-02-05', '2024-02-09', '2024-02-14', '2024-02-18', '2024-02-22', '2024-02-27',
  '2024-03-04', '2024-03-08', '2024-03-13', '2024-03-18', '2024-03-22', '2024-03-28',
  // 2024 Q2
  '2024-04-02', '2024-04-08', '2024-04-12', '2024-04-17', '2024-04-23', '2024-04-29',
  '2024-05-06', '2024-05-10', '2024-05-15', '2024-05-21', '2024-05-27', '2024-05-31',
  '2024-06-05', '2024-06-11', '2024-06-17', '2024-06-21', '2024-06-26',
  // 2024 Q3
  '2024-07-03', '2024-07-09', '2024-07-15', '2024-07-22', '2024-07-29',
  '2024-08-05', '2024-08-12', '2024-08-19', '2024-08-26',
  '2024-09-02', '2024-09-09', '2024-09-16', '2024-09-23', '2024-09-30',
  // 2024 Q4
  '2024-10-07', '2024-10-14', '2024-10-21', '2024-10-28',
  '2024-11-04', '2024-11-11', '2024-11-18', '2024-11-25',
  '2024-12-02', '2024-12-09', '2024-12-16', '2024-12-23', '2024-12-30',
  // 2025
  '2025-01-06', '2025-01-13', '2025-01-20', '2025-01-27',
  '2025-02-03', '2025-02-10', '2025-02-17', '2025-02-24',
  '2025-03-03', '2025-03-10', '2025-03-17', '2025-03-24',
];

// Sample distribution patterns for invoices to satisfy Doughnut chart categories:
// - 1 sample
// - 2 to 5 samples
// - 6 to 10 samples
// - > 10 samples
const sampleCountsPerInvoice = [
  1, 3, 4, 1, 8, 2, 11, 4, 1, 7, 3, 2, 1, 14, 5, 2, 9, 1, 3, 4,
  1, 2, 7, 3, 1, 12, 4, 2, 1, 8, 3, 5, 1, 2, 6, 1, 13, 4, 2, 3,
  1, 5, 2, 8, 3, 1, 4, 2, 11, 3, 1, 7, 4, 2, 1, 3, 9, 2, 1, 4
];

sampleDates.forEach((dateStr, idx) => {
  const invoiceNum = idx + 1;
  const codeFact = `FACT-${dateStr.slice(0, 4)}-${String(invoiceNum).padStart(3, '0')}`;
  const numFact = `F${dateStr.slice(0, 4)}/${String(invoiceNum).padStart(3, '0')}`;
  
  const nbSamples = sampleCountsPerInvoice[idx % sampleCountsPerInvoice.length];
  
  // Base invoice price calculation (e.g. 450 DH to 1200 DH per sample + batch fee)
  const baseRate = 380 + (idx % 7) * 45;
  const montantFact = parseFloat((nbSamples * baseRate + 250).toFixed(2));

  factures.push({
    code_fact: codeFact,
    date_fact: dateStr,
    num_fact: numFact,
    montant_fact: montantFact,
  });

  for (let s = 0; s < nbSamples; s++) {
    const codeEch = `ECH-${dateStr.slice(0, 4)}-${String(sampleCounter).padStart(4, '0')}`;
    sampleCounter++;
    
    // Choose product with intentional distribution (some more common than others)
    const productIdx = (s + idx * 3) % PRODUITS.length;
    const numProduit = PRODUITS[productIdx];

    echantillons.push({
      code_ech: codeEch,
      num_produit: numProduit,
      code_facture: codeFact,
    });

    detailsFacture.push({
      code_details: detailCounter++,
      code_fact: codeFact,
      code_ech: codeEch,
    });
  }
});

console.log(`[LOARC DB] Initialized with ${factures.length} invoices, ${echantillons.length} samples, ${detailsFacture.length} detail records.`);

// ============================================================================
// HELPER FILTER FUNCTIONS (Section 7, 12)
// ============================================================================

function getWeekNumber(date: Date): [number, number] {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return [d.getUTCFullYear(), weekNo];
}

function filterDataByParams(query: any) {
  const { mode, year, week, month, startDate, endDate } = query;

  let filteredFactures = [...factures];

  if (mode === 'week' && year && week) {
    const targetYear = parseInt(year);
    const targetWeek = parseInt(week);
    filteredFactures = factures.filter(f => {
      const d = new Date(f.date_fact);
      const [wYear, wNum] = getWeekNumber(d);
      return wYear === targetYear && wNum === targetWeek;
    });
  } else if (mode === 'month' && year && month) {
    const targetYear = parseInt(year);
    const targetMonth = parseInt(month); // 1-12
    filteredFactures = factures.filter(f => {
      const d = new Date(f.date_fact);
      return d.getFullYear() === targetYear && (d.getMonth() + 1) === targetMonth;
    });
  } else if (mode === 'custom' && startDate && endDate) {
    filteredFactures = factures.filter(f => {
      return f.date_fact >= startDate && f.date_fact <= endDate;
    });
  } else if (year && !week && !month) {
    const targetYear = parseInt(year);
    filteredFactures = factures.filter(f => {
      return new Date(f.date_fact).getFullYear() === targetYear;
    });
  }

  // Strict join constraints (Section 12):
  // Associate samples strictly via code_facture without duplication!
  const validFactureCodes = new Set(filteredFactures.map(f => f.code_fact));
  const filteredEchantillons = echantillons.filter(e => validFactureCodes.has(e.code_facture));

  return {
    factures: filteredFactures,
    echantillons: filteredEchantillons,
  };
}

// Compute statistics and chart datasets
function computeStatistics(filteredFactures: Facture[], filteredEchantillons: Echantillon[]) {
  // KPI 1: Total Échantillons
  const totalEchantillons = filteredEchantillons.length;

  // KPI 2: Total Factures
  const totalFactures = filteredFactures.length;

  // KPI 3: Chiffre d'affaires total (No multiplication!)
  const totalCA = filteredFactures.reduce((sum, f) => sum + f.montant_fact, 0);

  // KPI 4: Montant moyen des factures
  const montantMoyen = totalFactures > 0 ? (totalCA / totalFactures) : 0;

  // Facture avec montant le plus élevé
  let maxFacture: Facture | null = null;
  filteredFactures.forEach(f => {
    if (!maxFacture || f.montant_fact > maxFacture.montant_fact) {
      maxFacture = f;
    }
  });

  // Group by date for temporal graphs
  const dateFactureMap = new Map<string, { count: number; ca: number }>();
  filteredFactures.forEach(f => {
    const d = f.date_fact;
    const existing = dateFactureMap.get(d) || { count: 0, ca: 0 };
    existing.count += 1;
    existing.ca += f.montant_fact;
    dateFactureMap.set(d, existing);
  });

  // Group samples by associated invoice date
  const dateEchantillonMap = new Map<string, number>();
  // Create quick lookup for invoice date
  const factDateMap = new Map(factures.map(f => [f.code_fact, f.date_fact]));
  filteredEchantillons.forEach(e => {
    const d = factDateMap.get(e.code_facture);
    if (d) {
      dateEchantillonMap.set(d, (dateEchantillonMap.get(d) || 0) + 1);
    }
  });

  // Sorted unique dates for timeline
  const allDates = Array.from(new Set([...dateFactureMap.keys(), ...dateEchantillonMap.keys()])).sort();

  // Graphique 1: Évolution des échantillons (Line)
  const evolutionEchantillons = {
    labels: allDates,
    values: allDates.map(d => dateEchantillonMap.get(d) || 0),
  };

  // Graphique 2: Évolution du chiffre d'affaires (Area / Line)
  const evolutionCA = {
    labels: allDates,
    values: allDates.map(d => dateFactureMap.get(d)?.ca || 0),
  };

  // Graphique 3: Échantillons par produit (Bar)
  const productCountMap = new Map<string, number>();
  PRODUITS.forEach(p => productCountMap.set(p, 0));
  filteredEchantillons.forEach(e => {
    productCountMap.set(e.num_produit, (productCountMap.get(e.num_produit) || 0) + 1);
  });

  const echantillonsParProduit = {
    labels: Array.from(productCountMap.keys()),
    values: Array.from(productCountMap.values()),
  };

  // Graphique 4: Répartition des factures par nombre d'échantillons (Doughnut)
  // Factures avec 1 échantillon, 2 à 5, 6 à 10, plus de 10
  const sampleCountsPerFact = new Map<string, number>();
  filteredEchantillons.forEach(e => {
    sampleCountsPerFact.set(e.code_facture, (sampleCountsPerFact.get(e.code_facture) || 0) + 1);
  });

  let cat1 = 0;       // 1 échantillon
  let cat2to5 = 0;    // 2 à 5 échantillons
  let cat6to10 = 0;   // 6 à 10 échantillons
  let catOver10 = 0;  // > 10 échantillons

  filteredFactures.forEach(f => {
    const count = sampleCountsPerFact.get(f.code_fact) || 0;
    if (count === 1) cat1++;
    else if (count >= 2 && count <= 5) cat2to5++;
    else if (count >= 6 && count <= 10) cat6to10++;
    else if (count > 10) catOver10++;
  });

  const repartitionFactures = {
    categories: [
      '1 échantillon',
      '2 à 5 échantillons',
      '6 à 10 échantillons',
      'Plus de 10 échantillons',
    ],
    values: [cat1, cat2to5, cat6to10, catOver10],
  };

  // Graphique 5: Factures par période (Bar)
  const facturesParPeriode = {
    labels: allDates,
    values: allDates.map(d => dateFactureMap.get(d)?.count || 0),
  };

  // Graphique 6: Comparaison Échantillons / Factures (Mixed Chart)
  const comparaisonEchFact = {
    labels: allDates,
    echantillons: allDates.map(d => dateEchantillonMap.get(d) || 0),
    factures: allDates.map(d => dateFactureMap.get(d)?.count || 0),
  };

  // Top Produits
  const topProduits = Array.from(productCountMap.entries())
    .map(([num_produit, count]) => ({
      num_produit,
      count,
      percentage: totalEchantillons > 0 ? parseFloat(((count / totalEchantillons) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    kpi: {
      total_echantillons: totalEchantillons,
      total_factures: totalFactures,
      chiffre_affaires: totalCA,
      montant_moyen: montantMoyen,
    },
    evolution_echantillons: evolutionEchantillons,
    evolution_ca: evolutionCA,
    echantillons_par_produit: echantillonsParProduit,
    repartition_factures: repartitionFactures,
    factures_par_periode: facturesParPeriode,
    comparaison_ech_fact: comparaisonEchFact,
    top_produits: topProduits,
    facture_max: maxFacture ? {
      code_fact: (maxFacture as Facture).code_fact,
      date_fact: (maxFacture as Facture).date_fact,
      num_fact: (maxFacture as Facture).num_fact,
      montant_fact: (maxFacture as Facture).montant_fact,
      nb_echantillons: sampleCountsPerFact.get((maxFacture as Facture).code_fact) || 0,
    } : null,
  };
}

// ============================================================================
// REST API ROUTES (Mount on both /api and /LOARC/backend/api)
// ============================================================================

const apiRouter = express.Router();

// Health check
apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'LOARC Laboratory REST API',
    database: 'loarc (MySQL)',
    serverTime: new Date().toISOString(),
    metrics: {
      invoices_count: factures.length,
      samples_count: echantillons.length,
    },
  });
});

// Authentication
apiRouter.post('/login', (req, res) => {
  const { username, identifiant, password } = req.body;
  const loginId = (username || identifiant || '').trim().toLowerCase();
  const pwd = (password || '').trim();

  // Acceptable lab credentials:
  // admin / loarc2024, or any non-empty demo login if password matches loarc2024 / admin123
  if (
    (loginId === 'admin' && (pwd === 'loarc2024' || pwd === 'admin' || pwd === 'admin123')) ||
    (loginId === 'directeur@loarc.ma' && (pwd === 'loarc2024' || pwd === 'admin')) ||
    (loginId === 'technicien' && (pwd === 'loarc2024' || pwd === 'labo')) ||
    (pwd === 'loarc2024')
  ) {
    const isDirector = loginId.includes('directeur') || loginId === 'admin';
    return res.json({
      success: true,
      message: 'Connexion réussie',
      token: `loarc_jwt_${Buffer.from(loginId + ':' + Date.now()).toString('base64')}`,
      user: {
        id: 1,
        identifiant: loginId || 'admin',
        nom: isDirector ? 'Dr. Karim Bennani' : 'Sara Mansouri',
        role: isDirector ? 'Directeur de Laboratoire' : 'Technicienne d\'Analyses',
        email: isDirector ? 'directeur@loarc.ma' : 's.mansouri@loarc.ma',
        avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=120&auto=format&fit=crop&q=80',
      },
    });
  }

  return res.status(401).json({
    success: false,
    message: 'Identifiant ou mot de passe incorrect. (Utilisez admin / loarc2024)',
  });
});

apiRouter.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Déconnexion réussie' });
});

// GET /statistiques
apiRouter.get('/statistiques', (req, res) => {
  try {
    const { factures: filteredFactures, echantillons: filteredEchantillons } = filterDataByParams(req.query);
    const stats = computeStatistics(filteredFactures, filteredEchantillons);
    res.json({
      success: true,
      query: req.query,
      data: stats,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /echantillons
apiRouter.get('/echantillons', (req, res) => {
  try {
    const { echantillons: filteredEch } = filterDataByParams(req.query);
    const factDateMap = new Map(factures.map(f => [f.code_fact, { date: f.date_fact, montant: f.montant_fact, num: f.num_fact }]));
    
    const enriched = filteredEch.map(e => {
      const fact = factDateMap.get(e.code_facture);
      return {
        code_ech: e.code_ech,
        num_produit: e.num_produit,
        code_facture: e.code_facture,
        date_facture: fact?.date || null,
        num_fact: fact?.num || null,
        montant_fact: fact?.montant || null,
      };
    });

    res.json({
      success: true,
      count: enriched.length,
      data: enriched,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /factures
apiRouter.get('/factures', (req, res) => {
  try {
    const { factures: filteredFactures, echantillons: filteredEch } = filterDataByParams(req.query);
    
    // Count samples per invoice
    const sampleCounts = new Map<string, number>();
    filteredEch.forEach(e => {
      sampleCounts.set(e.code_facture, (sampleCounts.get(e.code_facture) || 0) + 1);
    });

    const enriched = filteredFactures.map(f => ({
      code_fact: f.code_fact,
      date_fact: f.date_fact,
      num_fact: f.num_fact,
      montant_fact: f.montant_fact,
      nb_echantillons: sampleCounts.get(f.code_fact) || 0,
    }));

    res.json({
      success: true,
      count: enriched.length,
      data: enriched,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /factures/:codeFacture/echantillons
apiRouter.get('/factures/:codeFacture/echantillons', (req, res) => {
  try {
    const codeFacture = req.params.codeFacture;
    const facture = factures.find(f => f.code_fact.toLowerCase() === codeFacture.toLowerCase());
    
    const relatedSamples = echantillons.filter(e => e.code_facture.toLowerCase() === codeFacture.toLowerCase());

    res.json({
      success: true,
      facture: facture || null,
      count: relatedSamples.length,
      data: relatedSamples,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Mount routes on both standard API path and PHP-compatible path
app.use('/api', apiRouter);
app.use('/LOARC/backend/api', apiRouter);

// Forward root requests
app.get('/', (req, res) => {
  res.redirect('/frontend/index.html');
});
app.get('/login', (req, res) => {
  res.redirect('/frontend/login.html');
});

// Serve static frontend files directly
app.use('/frontend', express.static(path.resolve(__dirname, 'frontend')));
app.use('/src/assets', express.static(path.resolve(__dirname, 'src/assets')));

async function startServer() {
  // Vite dev server middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[LOARC] Server active on http://0.0.0.0:${PORT}`);
    console.log(`[LOARC] REST API mounted on /api and /LOARC/backend/api`);
  });
}

startServer();
