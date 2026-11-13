// Natural Earth 1:110m land, public domain: https://www.naturalearthdata.com/about/terms-of-use/
// node scripts/generate-globe-land.mjs path/to/ne_110m_land.geojson
import { readFile, writeFile } from 'node:fs/promises'

const data = JSON.parse(await readFile(process.argv[2], 'utf8'))
const rings = data.features.flatMap(({ geometry }) => geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates)
const contains = (ring, x, y) => {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [ax, ay] = ring[i], [bx, by] = ring[j]
    if ((ay > y) !== (by > y) && x < (bx - ax) * (y - ay) / (by - ay) + ax) inside = !inside
  }
  return inside
}
const polygons = rings.map(r => ({ rings: r, minX: Math.min(...r[0].map(p => p[0])), maxX: Math.max(...r[0].map(p => p[0])), minY: Math.min(...r[0].map(p => p[1])), maxY: Math.max(...r[0].map(p => p[1])) }))
const points = []
for (let i = 0; i < 90000; i++) {
  const lat = Math.asin(1 - 2 * (i + .5) / 90000) * 180 / Math.PI
  const lon = ((i * 137.507764) % 360) - 180
  if (lat < -58) continue
  if (polygons.some(p => lon >= p.minX && lon <= p.maxX && lat >= p.minY && lat <= p.maxY && contains(p.rings[0], lon, lat) && !p.rings.slice(1).some(r => contains(r, lon, lat)))) points.push(+lon.toFixed(2), +lat.toFixed(2))
}
await writeFile('src/components/globe/land-points.json', JSON.stringify(points))
console.log(`${points.length / 2} land particles generated`)
