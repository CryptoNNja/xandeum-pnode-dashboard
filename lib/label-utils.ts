export interface GlobeLabel {
  lat: number;
  lng: number;
  text: string;
  size: number;
  color: string;
  altitude: number;
  priority: number;
}

/**
 * Pays prioritaires - toujours affichés si visibles
 */
const PRIORITY_COUNTRIES = new Set([
  'United States', 'USA', 'US',
  'Germany', 'DE',
  'France', 'FR',
  'United Kingdom', 'UK', 'GB',
  'Japan', 'JP',
  'China', 'CN',
  'Singapore', 'SG',
  'Australia', 'AU',
  'Canada', 'CA',
  'Netherlands', 'NL',
  'Switzerland', 'CH',
  'India', 'IN',
  'Brazil', 'BR',
  'South Korea', 'KR',
]);

/**
 * Nombre max de labels selon l'altitude
 */
export function getMaxLabels(altitude: number): number {
  if (altitude > 2.5) return 8;    // Vue globale: très peu
  if (altitude > 1.5) return 15;   // Vue continentale
  if (altitude > 0.8) return 25;   // Vue régionale
  if (altitude > 0.4) return 40;   // Vue pays
  return 60;                        // Vue ville: beaucoup
}

/**
 * Détecte si deux labels se chevauchent
 * Basé sur la distance approximative à l'écran
 */
function labelsOverlap(
  label1: GlobeLabel,
  label2: GlobeLabel,
  minDistance: number
): boolean {
  // Distance euclidienne simple (approximation acceptable pour labels proches)
  const dLat = Math.abs(label1.lat - label2.lat);
  const dLng = Math.abs(label1.lng - label2.lng);
  
  // Ajuste la distance lng par la latitude (les méridiens convergent aux pôles)
  const avgLat = (label1.lat + label2.lat) / 2;
  const lngFactor = Math.cos(avgLat * Math.PI / 180);
  
  const distance = Math.sqrt(dLat * dLat + (dLng * lngFactor) * (dLng * lngFactor));
  
  return distance < minDistance;
}

/**
 * Filtre les labels pour éviter les chevauchements
 * @param labels - Tous les labels potentiels
 * @param altitude - Altitude actuelle du globe
 * @param accentColor - Couleur d'accent du thème
 * @returns Labels filtrés sans chevauchement
 */
export function filterLabels(
  labels: Array<{ name: string; lat: number; lng: number; nodeCount?: number }>,
  altitude: number,
  accentColor: string
): GlobeLabel[] {
  const maxLabels = getMaxLabels(altitude);
  
  // Distance minimum entre labels (en degrés, ajustée par altitude)
  const minDistance = altitude > 1.5 ? 15 : altitude > 0.8 ? 8 : 4;
  
  // Trie par priorité: pays prioritaires d'abord, puis par nombre de nodes
  const sorted = [...labels].sort((a, b) => {
    const aPriority = PRIORITY_COUNTRIES.has(a.name) ? 1000 : 0;
    const bPriority = PRIORITY_COUNTRIES.has(b.name) ? 1000 : 0;
    const aCount = a.nodeCount || 0;
    const bCount = b.nodeCount || 0;
    
    return (bPriority + bCount) - (aPriority + aCount);
  });

  const result: GlobeLabel[] = [];
  
  for (const label of sorted) {
    if (result.length >= maxLabels) break;
    
    const newLabel: GlobeLabel = {
      lat: label.lat,
      lng: label.lng,
      text: label.name,
      size: altitude > 1.5 ? 0.7 : 0.5,
      color: accentColor,
      altitude: 0.01,
      priority: PRIORITY_COUNTRIES.has(label.name) ? 1 : 0,
    };
    
    // Vérifie les collisions avec les labels déjà sélectionnés
    const hasCollision = result.some(existing => 
      labelsOverlap(existing, newLabel, minDistance)
    );
    
    if (!hasCollision) {
      result.push(newLabel);
    }
  }
  
  return result;
}

/**
 * Génère les labels de pays à partir des données GeoJSON
 */
export function generateCountryLabels(
  countriesData: any,
  nodesByCountry: Map<string, number>,
  altitude: number,
  accentColor: string
): GlobeLabel[] {
  if (!countriesData?.features) return [];
  
  const labels = countriesData.features
    .filter((f: any) => f.properties?.name)
    .map((f: any) => {
      // Calcule le centroïde approximatif
      let lat = 0, lng = 0, count = 0;
      
      const processCoords = (coords: number[]) => {
        if (coords.length >= 2) {
          lng += coords[0];
          lat += coords[1];
          count++;
        }
      };
      
      const processGeometry = (geometry: any) => {
        if (geometry.type === 'Polygon') {
          geometry.coordinates[0]?.forEach(processCoords);
        } else if (geometry.type === 'MultiPolygon') {
          geometry.coordinates.forEach((poly: any) => poly[0]?.forEach(processCoords));
        }
      };
      
      processGeometry(f.geometry);
      
      return {
        name: f.properties.name,
        lat: count > 0 ? lat / count : 0,
        lng: count > 0 ? lng / count : 0,
        nodeCount: nodesByCountry.get(f.properties.name) || 0,
      };
    })
    .filter((l: any) => l.lat !== 0 && l.lng !== 0);
  
  return filterLabels(labels, altitude, accentColor);
}

/**
 * Génère les labels de villes (uniquement quand zoomé)
 */
export function generateCityLabels(
  cities: Array<{ city: string; lat: number; lng: number; country: string }>,
  altitude: number,
  accentColor: string
): GlobeLabel[] {
  // N'affiche les villes que quand on est assez zoomé
  if (altitude > 1.0) return [];
  
  const labels = cities.map(c => ({
    name: c.city,
    lat: c.lat,
    lng: c.lng,
    nodeCount: 1,
  }));
  
  return filterLabels(labels, altitude, accentColor);
}
