/** Modelo autoral em metros. Executar: node assets-raw/models/gerar-spda.mjs.
 * Sem quantização ou codecs: preserva os eixos e permite edição das peças no bruto.
 */
import * as T from 'three'
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { readFile, writeFile } from 'node:fs/promises'
import { NodeIO } from '@gltf-transform/core'
import sharp from 'sharp'

const fonte = await readFile(new URL('../../src/design/tokens.ts', import.meta.url), 'utf8')
const paleta = Object.fromEntries([...fonte.matchAll(/(\w+): '(#[0-9a-fA-F]{6})'/g)].map(m => [m[1], m[2]]))
const materiais = {}
for (const nome of ['concreto', 'cobertura', 'metal', 'cobre', 'isolador', 'vidro', 'aluminio']) {
  materiais[nome] = new T.MeshStandardMaterial({ name: `SPDA_${nome}`, color: paleta[nome],
    roughness: nome === 'vidro' ? 0.13 : nome === 'cobre' ? 0.4 : nome === 'aluminio' ? 0.38 : 0.78,
    metalness: nome === 'vidro' ? 0.55 : ['metal', 'cobre', 'aluminio'].includes(nome) ? 0.65 : 0.0 })
}
const cena = new T.Scene()
cena.name = 'Predio_industrial_SPDA_metros'
function malha(nome, geo, mat, pos) {
  const m = new T.Mesh(geo, materiais[mat]); m.name = nome; m.position.set(...pos); cena.add(m); return m
}
function caixa(nome, pos, dimensoes, mat) { return malha(nome, new T.BoxGeometry(...dimensoes), mat, pos) }
function fio(nome, a, b, raio = 0.025, mat = 'cobre') {
  const va = new T.Vector3(...a), vb = new T.Vector3(...b)
  const m = malha(nome, new T.CylinderGeometry(raio, raio, va.distanceTo(vb), 8), mat, va.clone().add(vb).multiplyScalar(0.5).toArray())
  m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), vb.sub(va).normalize()); return m
}

// Fachadas com pilares, juntas, esquadrias e acesso de manutenção; sem piso/céu duplicados.
// Corpo termina sob a laje: superfícies coplanares produzem cintilação na cobertura.
// Térreo oco: sala acessível pela porta norte; pavimentos superiores preservados.
caixa('Nucleo_edificacao', [0, 5.9, 0], [11.48, 5.8, 7.48], 'concreto')
caixa('Divisoria_sala_leste', [-0.8, 1.65, -1.5], [0.16, 2.7, 4.5], 'concreto')
caixa('Divisoria_sala_fundo', [-3.3, 1.65, 0.8], [5, 2.7, 0.16], 'concreto')
caixa('Piso_sala', [-3.3, 0.33, -1.5], [5, 0.04, 4.5], 'cobertura')
caixa('Embasamento', [0, 0.16, 0], [12.4, 0.32, 8.4], 'metal')
caixa('Laje', [0, 8.85, 0], [12.4, 0.3, 8.4], 'cobertura')
for (const z of [-4.1, 4.1]) {
  const s = Math.sign(z)
  // Vãos reais: vidro recuado, ombreiras, vergas e peitoris com pingadeira.
  for (const [base, topo] of [[2.7, 3.86], [5.34, 6.76], [8.24, 8.8]]) {
    caixa('Faixa_alvenaria', [0, (base + topo) / 2, s * 3.87], [12, topo - base, 0.26], 'concreto')
  }
  for (const [a, b] of [[-6, -4.3], [-3.1, -0.15], [3.75, 6]]) {
    caixa('Alvenaria_terreo', [(a + b) / 2, 1.35, s * 3.87], [b - a, 2.7, 0.26], 'concreto')
  }
  caixa('Verga_porta', [-3.7, 2.52, s * 3.87], [1.2, 0.36, 0.26], 'concreto')
  for (const y of [4.6, 7.5]) for (const [a, b] of [[-6, -5.54], [-3.26, -2.64], [-0.36, 0.36], [2.64, 3.26], [5.54, 6]]) {
    caixa('Ombreira_alvenaria', [(a + b) / 2, y, s * 3.87], [b - a, 1.48, 0.26], 'concreto')
  }
  caixa('Platibanda', [0, 9.08, z], [12.4, 0.16, 0.2], 'aluminio')
  for (const x of [-5.83, -3, 0, 3, 5.83]) caixa('Pilar_fachada', [x, 4.5, s * 4.015], [0.16, 8.7, 0.07], 'cobertura')
  for (const y of [3, 6]) {
    caixa('Junta_horizontal', [0, y, s * 4.007], [11.8, 0.025, 0.015], 'metal')
    caixa('Pingadeira_pavimento', [0, y + 0.1, s * 4.03], [11.8, 0.05, 0.15], 'cobertura')
  }
  for (const y of [4.6, 7.5]) for (const x of [-4.4, -1.5, 1.5, 4.4]) {
    caixa('Fundo_escuro_vao', [x, y, s * 3.755], [2.28, 1.48, 0.015], 'metal')
    caixa('Vidro', [x, y, s * 3.85], [2.1, 1.3, 0.025], 'vidro')
    for (const dx of [-1.095, 0, 1.095]) caixa('Perfil_esquadria', [x + dx, y, s * 3.9], [0.055, 1.42, 0.09], 'metal')
    for (const dy of [-0.71, 0.71]) caixa('Travessa_esquadria', [x, y + dy, s * 3.9], [2.25, 0.05, 0.09], 'metal')
    caixa('Peitoril_concreto', [x, y - 0.76, s * 3.98], [2.38, 0.08, 0.38], 'cobertura')
    caixa('Fecho_janela', [x + 0.08, y - 0.12, s * 3.96], [0.025, 0.13, 0.035], 'aluminio')
    // Veneziana parcial varia entre salas sem alterar a transparência do render.
    if (x === -1.5 || x === 4.4) for (let h = 0.15; h < 0.64; h += 0.055) {
      caixa('Persiana_interna', [x, y + h, s * 3.867], [2.08, 0.033, 0.012], 'isolador')
    }
  }
  caixa('Portao_servico', [1.8, 1.35, s * 3.87], [3.8, 2.7, 0.1], 'metal')
  for (let y = 0.12; y < 2.7; y += 0.12) caixa('Lamina_portao', [1.8, y, s * 3.94], [3.68, 0.085, 0.035], 'aluminio')
  for (const x of [-0.12, 3.72]) caixa('Guia_portao', [x, 1.375, s * 4.01], [0.08, 2.75, 0.12], 'metal')
  if (s < 0) {
    caixa('Porta_sala_aberta', [-4.25, 1.48, -3.3], [0.1, 2.3, 1.1], 'metal')
    fio('Puxador_sala', [-4.18, 1.2, -2.95], [-4.18, 1.5, -2.95], 0.018, 'aluminio')
  } else {
    caixa('Porta_pedestre', [-3.7, 1.15, s * 3.87], [1.1, 2.3, 0.1], 'metal')
    caixa('Visor_porta', [-3.7, 1.65, s * 3.93], [0.65, 0.55, 0.02], 'vidro')
    fio('Puxador_porta', [-3.34, 0.93, s * 4.02], [-3.34, 1.23, s * 4.02], 0.018, 'aluminio')
  }
  caixa('Soleira_porta', [-3.7, 0.035, s * 4.04], [1.25, 0.07, 0.25], 'cobertura')
  caixa('Marquise', [-0.8, 2.95, s * 4.16], [8.5, 0.09, 0.72], 'metal')
  for (const x of [-4.7, 3.1]) fio('Tirante_marquise', [x, 3.65, s * 4], [x, 3, s * 4.48], 0.018, 'aluminio')
  for (const x of [-4.8, 4.7]) {
    caixa('Arandela', [x, 2.38, s * 4.075], [0.26, 0.14, 0.14], 'metal')
    caixa('Difusor_arandela', [x, 2.37, s * 4.152], [0.2, 0.075, 0.02], 'isolador')
  }
}
for (const x of [-6.1, 6.1]) {
  const s = Math.sign(x)
  caixa('Parede_lateral_inferior', [s * 5.87, 3.38, 0], [0.26, 6.76, 8], 'concreto')
  caixa('Parede_lateral_superior', [s * 5.87, 8.52, 0], [0.26, 0.56, 8], 'concreto')
  for (const [a, b] of [[-4, -3.3], [-1.7, -0.8], [0.8, 1.7], [3.3, 4]]) {
    caixa('Ombreira_lateral', [s * 5.87, 7.5, (a + b) / 2], [0.26, 1.48, b - a], 'concreto')
  }
  caixa('Platibanda_lateral', [x, 9.08, 0], [0.2, 0.16, 8], 'aluminio')
  for (const y of [3, 6]) caixa('Junta_lateral', [s * 6.007, y, 0], [0.015, 0.025, 7.9], 'metal')
  for (const z of [-2.5, 0, 2.5]) {
    caixa('Fundo_janela_lateral', [s * 5.755, 7.5, z], [0.015, 1.48, 1.6], 'metal')
    caixa('Vidro_lateral', [s * 5.85, 7.5, z], [0.025, 1.3, 1.45], 'vidro')
    for (const dz of [-0.76, 0, 0.76]) caixa('Perfil_lateral', [s * 5.9, 7.5, z + dz], [0.09, 1.4, 0.05], 'metal')
    for (const dy of [-0.71, 0.71]) caixa('Travessa_lateral', [s * 5.9, 7.5 + dy, z], [0.09, 0.05, 1.58], 'metal')
    caixa('Peitoril_lateral', [s * 5.98, 6.74, z], [0.38, 0.08, 1.72], 'cobertura')
  }
  // Drenagem pluvial distinta do cobre do SPDA, afastada das caixas de teste.
  fio('Tubo_pluvial', [s * 6.09, 0.2, -3.35], [s * 6.09, 8.85, -3.35], 0.055, 'metal')
  for (const y of [0.6, 2.6, 4.6, 6.6, 8.4]) caixa('Suporte_pluvial', [s * 6.1, y, -3.35], [0.16, 0.055, 0.16], 'aluminio')
  caixa('Veneziana_tecnica', [s * 6.02, 1.6, -1.25], [0.08, 0.65, 1.15], 'metal')
  for (let y = 1.34; y < 1.9; y += 0.07) caixa('Aleta_ventilacao', [s * 6.075, y, -1.25], [0.035, 0.025, 1.03], 'aluminio')
}
// Cobertura técnica baixa não interfere na leitura do anel.
for (const x of [-2, 2]) {
  caixa('Base_exaustor', [x, 9.12, 0.5], [1.3, 0.24, 1.3], 'metal')
  fio('Exaustor', [x, 9.2, 0.5], [x, 9.7, 0.5], 0.4, 'aluminio')
  fio('Chapeu_exaustor', [x, 9.71, 0.5], [x, 9.77, 0.5], 0.48, 'metal')
  for (let ang = 0; ang < Math.PI * 2; ang += Math.PI / 6) {
    fio('Nervura_exaustor', [x + Math.cos(ang) * 0.4, 9.28, 0.5 + Math.sin(ang) * 0.4], [x + Math.cos(ang) * 0.4, 9.69, 0.5 + Math.sin(ang) * 0.4], 0.014, 'metal')
  }
}
caixa('Alcapao_cobertura', [3.5, 9.06, -1.8], [1.1, 0.12, 1.5], 'metal')
for (const x of [3.07, 3.93]) caixa('Dobradiça_alcapao', [x, 9.14, -2.3], [0.09, 0.04, 0.2], 'aluminio')
// Juntas da manta impermeável, sem adicionar outro plano coplanar sobre a laje.
for (let x = -5; x <= 5; x += 1) caixa('Junta_manta', [x, 9.003, 0], [0.012, 0.004, 7.8], 'metal')

const quinas = [[-6.25, -4.25], [6.25, -4.25], [6.25, 4.25], [-6.25, 4.25]]
const alturaAnel = 9.35
for (let i = 0; i < 4; i++) {
  const [x, z] = quinas[i], [xx, zz] = quinas[(i + 1) % 4]
  fio('Anel_captacao', [x, alturaAnel, z], [xx, alturaAnel, zz])
  fio(`Descida_D${i + 1}`, [x, 0.79, z], [x, alturaAnel, z])
  fio(`Aterramento_D${i + 1}`, [x, 0, z], [x, 0.61, z])
  for (let y = 1.35; y < 9; y += 1) {
    fio('Suporte_descida', [Math.sign(x) * 5.98, y, Math.sign(z) * 3.98], [x, y, z], 0.025, 'aluminio')
    caixa('Abracadeira', [x, y, z], [0.09, 0.08, 0.09], 'metal')
  }
  const s = Math.sign(z)
  caixa(`Fundo_caixa_D${i + 1}`, [x, 0.7, z - s * 0.06], [0.46, 0.58, 0.1], 'metal')
  for (const dx of [-0.235, 0.235]) caixa('Lateral_caixa', [x + dx, 0.7, z + s * 0.06], [0.035, 0.6, 0.25], 'aluminio')
  for (const y of [0.41, 0.99]) caixa('Borda_caixa', [x, y, z + s * 0.06], [0.5, 0.03, 0.25], 'aluminio')
  for (const y of [0.56, 0.84]) {
    caixa(`Terminal_D${i + 1}`, [x, y, z + s * 0.065], [0.17, 0.1, 0.065], 'cobre')
    fio('Parafuso_conector', [x + 0.055, y, z + s * 0.09], [x + 0.055, y, z + s * 0.13], 0.023, 'aluminio')
  }
  // Tampa aberta permite ver e identificar o ponto de contato sem transparência.
  const tampa = caixa('Tampa_aberta', [x + Math.sign(x) * 0.39, 0.7, z + s * 0.21], [0.42, 0.58, 0.025], 'metal')
  tampa.rotation.y = -s * Math.sign(x) * Math.PI / 3
}
for (const [x, z] of [...quinas, [0, -4.25], [0, 4.25]]) {
  fio('Captor', [x, alturaAnel, z], [x, 10.05, z], 0.025, 'aluminio')
  caixa('Base_captor', [x, alturaAnel - 0.12, z], [0.16, 0.08, 0.16], 'isolador')
}
for (const z of [-4.25, 4.25]) for (const x of [-4.5, -3, -1.5, 1.5, 3, 4.5]) {
  caixa('Suporte_anel', [x, 9.23, z], [0.12, 0.19, 0.12], 'isolador')
}

// Sala elétrica interna: QGBT fechado e BEP acessível ao lado.
caixa('QGBT_gabinete', [-2.6, 1.4, 0.33], [1.6, 2.1, 0.6], 'metal')
caixa('QGBT_porta', [-2.6, 1.4, 0.015], [1.49, 1.97, 0.03], 'aluminio')
caixa('QGBT_visor', [-2.6, 1.9, -0.008], [0.5, 0.23, 0.025], 'vidro')
fio('QGBT_puxador', [-1.98, 1.25, -0.04], [-1.98, 1.6, -0.04], 0.025, 'metal')
caixa('Fundo_BEP', [-4.8, 1.2, 0.67], [1.15, 0.65, 0.1], 'metal')
caixa('Barramento_BEP', [-4.8, 1.2, 0.57], [0.95, 0.14, 0.07], 'cobre')
for (const x of [-5.15, -4.95, -4.65, -4.45]) fio('Terminal_BEP', [x, 1.2, 0.535], [x, 1.2, 0.49], 0.028, 'aluminio')
const ligacao = [[-6.25, 0.56, -4.25], [-6.25, 0.4, -4.25], [-5.5, 0.4, -4.25], [-5.5, 0.4, 0.5], [-4.8, 0.4, 0.5], [-4.8, 1.2, 0.535]]
for (let i = 1; i < ligacao.length; i++) fio('Ligacao_D1_BEP', ligacao[i - 1], ligacao[i], 0.029)
fio('Ligacao_QGBT_BEP', [-4.45, 1.2, 0.535], [-3.45, 1.2, 0.535], 0.025)
fio('PE_QGBT', [-3.45, 1.2, 0.535], [-3.45, 0.5, 0.33], 0.025)

// FileReader mínimo para exportação binária no Node, sem texturas externas.
globalThis.FileReader = class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then(r => { this.result = r; this.onloadend?.() }) }
}
const exportador = new GLTFExporter()
// UV em metros mantém os poros do reboco na mesma escala em paredes e ombreiras.
cena.updateMatrixWorld(true)
for (const m of cena.children) {
  if (![materiais.concreto, materiais.cobertura].includes(m.material)) continue
  const p = m.geometry.attributes.position, n = m.geometry.attributes.normal, uv = m.geometry.attributes.uv
  const v = new T.Vector3()
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i).applyMatrix4(m.matrixWorld)
    if (Math.abs(n.getY(i)) > 0.5) uv.setXY(i, v.x / 2, v.z / 2)
    else if (Math.abs(n.getX(i)) > 0.5) uv.setXY(i, v.z / 2, v.y / 2)
    else uv.setXY(i, v.x / 2, v.y / 2)
  }
}
const io = new NodeIO()
// Mapas PBR autorais, determinísticos e repetíveis; não dependem de imagens remotas.
const N = 512, altura = new Float32Array(N * N)
let semente = 5419
const ruido = () => { semente = (Math.imul(semente, 1664525) + 1013904223) >>> 0; return semente / 4294967296 }
for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
  const amplo = Math.sin(x / N * Math.PI * 8) * Math.sin(y / N * Math.PI * 6)
  altura[y * N + x] = 0.5 + amplo * 0.015 + (ruido() - 0.5) * 0.24 - (ruido() > 0.985 ? 0.3 : 0)
}
const difusa = Buffer.alloc(N * N * 3), normal = Buffer.alloc(N * N * 3), rugosidade = Buffer.alloc(N * N * 3)
const h = (x, y) => altura[((y + N) % N) * N + (x + N) % N]
for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
  const i = (y * N + x) * 3, v = h(x, y)
  const cinza = Math.round(238 + (v - 0.5) * 24)
  difusa[i] = difusa[i + 1] = difusa[i + 2] = cinza
  normal[i] = Math.round(128 + (h(x - 1, y) - h(x + 1, y)) * 70)
  normal[i + 1] = Math.round(128 + (h(x, y - 1) - h(x, y + 1)) * 70)
  normal[i + 2] = 254
  rugosidade[i] = 255; rugosidade[i + 1] = Math.round(225 + v * 28); rugosidade[i + 2] = 0
}
const png = b => sharp(b, { raw: { width: N, height: N, channels: 3 } }).png().toBuffer()
const mapas = await Promise.all([png(difusa), png(normal), png(rugosidade)])
async function gravarModelo(cenario, caminho) {
  const bin = new Uint8Array(await exportador.parseAsync(cenario, { binary: true }))
  const doc = await io.readBinary(bin)
  const texturas = mapas.map((b, i) => doc.createTexture(['Reboco_cor', 'Reboco_normal', 'Reboco_rugosidade'][i]).setImage(b).setMimeType('image/png'))
  for (const mat of doc.getRoot().listMaterials()) {
    if (!['SPDA_concreto', 'SPDA_cobertura'].includes(mat.getName())) continue
    mat.setBaseColorTexture(texturas[0]).setNormalTexture(texturas[1]).setNormalScale(0.3).setMetallicRoughnessTexture(texturas[2])
    for (const info of [mat.getBaseColorTextureInfo(), mat.getNormalTextureInfo(), mat.getMetallicRoughnessTextureInfo()]) {
      info.setWrapS(10497).setWrapT(10497)
    }
  }
  await writeFile(caminho, await io.writeBinary(doc))
}
await gravarModelo(cena, new URL('./spda-predio.glb', import.meta.url))
// Fundir por material reduz centenas de chamadas de desenho a sete, sem alterar vértices.
cena.updateMatrixWorld(true)
const leve = new T.Scene()
for (const mat of Object.values(materiais)) {
  const geos = cena.children.filter(m => m.material === mat).map(m => m.geometry.clone().applyMatrix4(m.matrixWorld))
  const m = new T.Mesh(mergeGeometries(geos), mat); m.name = mat.name; leve.add(m)
}
const box = new T.Box3().setFromObject(leve)
const tamanho = box.getSize(new T.Vector3()), centro = box.getCenter(new T.Vector3())
// Normalização do Equipment3D é reproduzida no relatório para auditar a calibração.
const relatorio = { min: box.min.toArray(), max: box.max.toArray(), escalaAlvo: Math.max(...tamanho.toArray()), deslocamento: [-centro.x, -box.min.y, -centro.z] }
await gravarModelo(leve, new URL('../../public/models/spda-predio.glb', import.meta.url))
await writeFile(new URL('./spda-geometria.json', import.meta.url), JSON.stringify(relatorio, null, 2) + '\n')
console.log(relatorio)
