/** Modelo autoral em metros. Executar: npx vite-node scripts/gerar-usina-fv.ts.
 * Só geometria visual: não importa resultados, engines nem métodos de cálculo.
 */
import * as T from 'three'
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { FontLoader } from 'three/addons/loaders/FontLoader.js'
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js'
import { color } from '../src/design/tokens'
import { MESAS_FV, MESA, MODULO, USINA, PILARES_POR_FILA, pilarMesa, SKID, TRAFO, SE, POSTE_MT, CERCA, PORTAO, ESTACAS_FV, PONTOS_CONTINUIDADE_FV } from '../src/catalog/usinaFvPontos'

const C = color.usinaFv
const fonte = new FontLoader().parse(JSON.parse(await readFile('node_modules/three/examples/fonts/helvetiker_regular.typeface.json', 'utf8')))
const mats = Object.fromEntries(Object.entries({ metal: C.estrutura, moldura: C.moldura, celula: C.modulo, skid: C.skid, trafo: C.trafo, concreto: C.alvenaria, escuro: color.inbrat.borracha, cobre: color.spda.cobre, isolador: color.spda.isolador, aviso: color.accent }).map(([n,c]) => [n, new T.MeshStandardMaterial({ name:n, color:c, roughness:n==='celula' ? .3 : .65, metalness:['metal','moldura','trafo','cobre'].includes(n) ? .65 : .1 })]))
const kit = new T.Scene(); kit.name = 'Kit_usina_metros_Y_cima'
function peca(nome:string) { const g=new T.Group(); g.name=nome; kit.add(g); return g }
function caixa(g:T.Group, d:number[], p:number[], mat='metal', fino=false) { const m=new T.Mesh(new T.BoxGeometry(...d as [number,number,number]),mats[mat]); m.position.set(...p as [number,number,number]); m.name=fino?'detalhe':'corpo'; g.add(m); return m }
function fio(g:T.Group,a:number[],b:number[],r=.02,mat='metal',fino=false) { const va=new T.Vector3(...a as [number,number,number]),vb=new T.Vector3(...b as [number,number,number]); const m=new T.Mesh(new T.CylinderGeometry(r,r,va.distanceTo(vb),6),mats[mat]); m.position.copy(va.clone().add(vb).multiplyScalar(.5)); m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),vb.sub(va).normalize());m.name=fino?'detalhe':'corpo';g.add(m);return m }
function aviso(g:T.Group,p:number[],rot=0) {
  const placa=new T.Group(); placa.position.set(...p as [number,number,number]);placa.rotation.y=rot;g.add(placa)
  caixa(placa,[.76,.42,.025],[0,0,0],'aviso')
  // Símbolo de raio legível mesmo quando o texto está longe.
  fio(placa,[.04,.12,-.018],[-.05,.01,-.018],.013,'escuro'); fio(placa,[-.05,.01,-.018],[.04,.01,-.018],.013,'escuro');fio(placa,[.04,.01,-.018],[-.04,-.12,-.018],.013,'escuro')
  texto(placa,'PERIGO',[0,.14,-.02],.05)
  texto(placa,'ELETRICIDADE',[0,-.18,-.02],.045)
}
function texto(g:T.Group,t:string,p:number[],tam=.055) {
  const geo=new TextGeometry(t,{font:fonte,size:tam,depth:.001,curveSegments:2})
  geo.computeBoundingBox();geo.translate(-geo.boundingBox!.max.x/2,0,0)
  if (!geo.index) geo.setIndex(Array.from({length:geo.attributes.position.count},(_,i)=>i))
  const m=new T.Mesh(geo,mats.escuro);m.rotation.y=Math.PI;m.position.set(...p as [number,number,number]);m.name='detalhe';g.add(m)
}
const mod=peca('kit_modulo')
// Moldura apenas no perímetro: uma chapa de alumínio sob o vidro causava z-fighting na vista geral.
for(const s of [-1,1]) {
  caixa(mod,[.02,MODULO.espessura,MODULO.comprimento],[s*(MODULO.largura-.02)/2,MODULO.espessura/2,0],'moldura')
  caixa(mod,[MODULO.largura-.04,MODULO.espessura,.02],[0,MODULO.espessura/2,s*(MODULO.comprimento-.02)/2],'moldura')
}
caixa(mod,[MODULO.largura-.04,.025,MODULO.comprimento-.04],[0,.0125,0],'celula')
// Grade de 144 meias-células fundida em uma geometria, descartável no perfil baixo.
for(let i=1;i<6;i++) caixa(mod,[.004,.002,MODULO.comprimento-.04],[-MODULO.largura/2+i*(MODULO.largura/6),.038,0],'moldura',true)
for(let i=1;i<24;i++) caixa(mod,[MODULO.largura-.04,.002,.004],[0,.038,-MODULO.comprimento/2+i*MODULO.comprimento/24],'moldura',true)
const estaca=peca('kit_mesa_estaca')
caixa(estaca,[.09,1,.012],[0,.5,0]);caixa(estaca,[.012,1,.055],[-.039,.5,.021]);caixa(estaca,[.012,1,.055],[.039,.5,.021])
const terca=peca('kit_mesa_terca');caixa(terca,[1,.065,.035],[0,.0325,0])
const skid=peca('kit_skid');const [sw,sh,sd]=SKID.dimensoes
caixa(skid,[sw+.6,.3,sd+.6],[0,.15,0],'concreto');caixa(skid,[sw,.1,sd],[0,.35,0],'metal')
caixa(skid,[sw,.1,sd],[0,sh+.25,0],'skid');caixa(skid,[sw,sh-.1,.08],[0,sh/2+.3,sd/2-.04],'skid')
for(const s of [-1,1]) caixa(skid,[.08,sh,sd],[s*(sw/2-.04),sh/2+.3,0],'skid')
for(let x=-2.8;x<3;x+=.18) caixa(skid,[.035,sh-.15,.04],[x,sh/2+.3,sd/2+.01],'metal',true)
// Face norte com vãos reais. Uma folha aberta e as demais recolhidas deixam ver os equipamentos.
for(const x of [-3,-.65,2.95]) caixa(skid,[.1,sh, .1],[x,sh/2+.3,-sd/2],'metal')
caixa(skid,[sw,.22,.1],[0,sh+.2,-sd/2],'skid')
const porta=caixa(skid,[2.25,2.2,.055],[-1.72,1.5,-sd/2],'skid');porta.rotation.y=-Math.PI*.40;porta.position.set(-2.7,1.5,-2.1)
for(const [i,x] of [-2.15,-.85,.45].entries()) {
  caixa(skid,[.85,1.25,.45],[x,1.3,.62],'skid');caixa(skid,[.22,.12,.025],[x,1.45,.38],'escuro')
  for(let y=.82;y<1.2;y+=.06) caixa(skid,[.68,.018,.02],[x,y,.38],'metal',true)
  fio(skid,[x,.65,.62],[x,.46,.62],.025,'escuro');skid.userData[`inversor_${i+1}`]='100 kW'
  texto(skid,`INV ${i+1} - 100 kW`,[x,1.7,.375])
}
caixa(skid,[1.05,2.05,.6],[2,1.43,.48],'metal');caixa(skid,[.98,1.96,.025],[2,1.43,.16],'skid');aviso(skid,[2,1.9,.13])
// Painel metálico ao norte mantém a massa de toque no ponto catalogado.
caixa(skid,[.75,2.15,.06],[0,1.4,-sd/2],'skid')
const trafo=peca('kit_trafo')
caixa(trafo,[3,.2,2.5],[0,.1,0],'concreto');caixa(trafo,[2,1.85,1.5],[0,1.125,0],'trafo');caixa(trafo,[2.1,.09,1.6],[0,2.095,0],'trafo')
for(const s of [-1,1]) for(let z=-.62;z<.7;z+=.115) caixa(trafo,[.3,1.35,.035],[s*1.13,1.1,z],'trafo',true)
for(const s of [-1,1]) for(let i=0;i<(s===1?3:4);i++) {
  const z=-.45+i*(s===1?.45:.3), h=s===1?.5:.25
  fio(trafo,[s*.72,2.14,z],[s*.72,2.14+h,z],.045,'isolador')
  for(let y=2.18;y<2.14+h;y+=.07) {const anel=new T.Mesh(new T.CylinderGeometry(.085,.085,.025,10),mats.isolador);anel.position.set(s*.72,y,z);anel.name='detalhe';trafo.add(anel)}
}
fio(trafo,[-.75,2.45,-.58],[.75,2.45,-.58],.16,'trafo');fio(trafo,[0,2.15,-.58],[0,2.45,-.58],.025,'trafo')
caixa(trafo,[.36,.22,.02],[.4,1.35,.76],'moldura');aviso(trafo,[-.45,1.25,.77],Math.PI)
const identificacao=new T.Group();identificacao.position.set(.4,1.35,.773);identificacao.rotation.y=Math.PI;trafo.add(identificacao)
texto(identificacao,'300 kVA',[0,.03,0],.04);texto(identificacao,'380 V / 13,8 kV',[0,-.04,0],.026)
const cabine=peca('kit_cabine');const [cw,ch,cd]=SE.dimensoes
caixa(cabine,[cw,ch,cd],[0,ch/2,0],'concreto');caixa(cabine,[cw+.4,.2,cd+.4],[0,ch+.1,0],'metal')
caixa(cabine,[.05,2.1,1.2],[-cw/2-.025,1.05,-.4],'metal');aviso(cabine,[-cw/2-.06,1.6,-.4],Math.PI/2)
for(let y=2;y<2.6;y+=.06) caixa(cabine,[1.3,.025,.035],[0,y,-cd/2-.02],'metal',true)
for(const z of [-1.1,.3]) caixa(cabine,[.07,2.25,.05],[-cw/2-.04,1.125,z],'moldura')
const poste=peca('kit_poste_mt');fio(poste,[0,0,0],[0,11,0],.15,'concreto');caixa(poste,[2.5,.13,.16],[0,10.4,0])
for(const x of [-1,0,1]) { fio(poste,[x,10.4,0],[x,10.95,0],.06,'isolador');fio(poste,[x,9.5,.3],[x,10.2,.3],.065,'isolador');fio(poste,[x,10.3,.2],[x,10.65,.45],.025,'cobre');fio(poste,[x,9.5,-.3],[x,9.95,-.3],.065,'isolador') }
const mourao=peca('kit_cerca_mourao');fio(mourao,[0,0,0],[0,2.3,0],.035);fio(mourao,[0,2.1,0],[0,2.3,.12],.025)
const painel=peca('kit_cerca_painel')
for(const y of [.1,2.05,2.17,2.27]) fio(painel,[-1.5,y,0],[1.5,y,0],.009)
// Losangos vazados reais, sem planos opacos entre aluno e ensaio.
for(const s of [-1,1]) for(let x=-3.5;x<3.5;x+=.16) {let ya=Math.max(.1,(-1.5-x)/s),yb=Math.min(2.05,(1.5-x)/s);if(s<0){ya=Math.max(.1,(1.5-x)/s);yb=Math.min(2.05,(-1.5-x)/s)} if(yb>ya) fio(painel,[x+s*ya,ya,0],[x+s*yb,yb,0],.004,'metal',true) }
for(let x=-1.4;x<1.5;x+=.3) fio(painel,[x-.04,2.23,-.04],[x+.04,2.31,.04],.005,'metal',true)
const portao=peca('kit_portao')
for(const s of [-1,1]) { const folha=new T.Group();folha.position.x=s;portao.add(folha);for(const x of [-.97,.97]) fio(folha,[x,.08,0],[x,2.03,0],.03);for(const y of [.08,2.03]) fio(folha,[-.97,y,0],[.97,y,0],.03);for(let x=-.85;x<1;x+=.13) fio(folha,[x,.1,0],[x,2,0],.008,'metal',true);fio(folha,[-.97,.08,0],[.97,2.03,0],.014) }
const inspecao=peca('kit_caixa_inspecao');caixa(inspecao,[.4,.08,.4],[0,.04,0],'concreto');caixa(inspecao,[.3,.015,.3],[0,.0875,0],'metal')

// Fundir somente dentro de cada peça/material mantém origens e reuso, com poucas chamadas.
for(const g of kit.children) {
 g.updateMatrixWorld(true);const lotes=new Map<string,{mat:T.Material,geos:T.BufferGeometry[]}>()
 g.traverse(o=>{if(!(o instanceof T.Mesh))return; const chave=o.material.uuid+o.name; const lote=lotes.get(chave)??{mat:o.material,geos:[]};lote.geos.push(o.geometry.clone().applyMatrix4(o.matrixWorld));lotes.set(chave,lote)})
 g.clear();for(const [k,l] of lotes) {const m=new T.Mesh(mergeGeometries(l.geos)!,l.mat);m.name=k.endsWith('detalhe')?'detalhe':'corpo';g.add(m)}
}
const cena=new T.Scene();cena.name='Usina_FV_300kW_metros'
function colocar(g:T.Object3D,pos:number[],escala=[1,1,1],q?:T.Quaternion) { const c=g.clone(true);c.position.set(...pos as [number,number,number]);c.scale.set(...escala as [number,number,number]);if(q)c.quaternion.copy(q);cena.add(c);return c }
const tilt=USINA.inclinacaoGraus*Math.PI/180,q=new T.Quaternion().setFromEuler(new T.Euler(-tilt,0,0)),ym=MESA.alturaBorda+MESA.profundidade/2*Math.sin(tilt)
for(const mesa of MESAS_FV) {
 for(let f=0;f<2;f++) for(let i=0;i<27;i++) {const p=new T.Vector3(-MESA.comprimento/2+MODULO.largura/2+i*(MODULO.largura+MODULO.folga),0,-MESA.profundidade/2+MODULO.comprimento/2+f*(MODULO.comprimento+MODULO.folga)).applyQuaternion(q).add(new T.Vector3(mesa.centro[0],ym,mesa.centro[2]));colocar(mod,p.toArray(),[1,1,1],q)}
 for(let i=0;i<PILARES_POR_FILA;i++) for(const s of [-1,1]) {const p=pilarMesa(mesa,i);p[2]=mesa.centro[2]+s*(p[2]-mesa.centro[2]);const h=ym+(p[2]-mesa.centro[2])*Math.tan(tilt)-.08;colocar(estaca,p,[1,h,1])}
 for(const s of [-1,1]) {const dz=s*(MESA.profundidade/2-.5)*Math.cos(tilt);colocar(terca,[mesa.centro[0],ym+dz*Math.tan(tilt)-.09,mesa.centro[2]+dz],[MESA.comprimento,1,1]);const cabos=new T.Group();cena.add(cabos);fio(cabos,[mesa.centro[0]-MESA.comprimento/2,ym+dz*Math.tan(tilt)-.13,mesa.centro[2]+dz],[mesa.centro[0]+MESA.comprimento/2,ym+dz*Math.tan(tilt)-.13,mesa.centro[2]+dz],.014,'escuro',true)}
 const terminal=PONTOS_CONTINUIDADE_FV.find(p=>p.id===mesa.id.toLowerCase())!;const j=new T.Group();cena.add(j);caixa(j,[.25,.18,.16],[terminal.pos[0],.65,terminal.pos[2]],'escuro')
 const apoio=pilarMesa(mesa,mesa.centro[0]<0?PILARES_POR_FILA-1:0)
 fio(j,[apoio[0],terminal.pos[1],apoio[2]],terminal.pos,.035,'metal')
}
colocar(skid,SKID.centro);colocar(trafo,TRAFO.centro);colocar(cabine,SE.centro);colocar(poste,POSTE_MT);colocar(portao,[PORTAO.x,0,CERCA.zMax]);colocar(inspecao,ESTACAS_FV.e)
const lados=[[-38,-29,38,-29],[38,-29,38,23],[38,23,-24,23],[-28,23,-38,23],[-38,23,-38,-29]]
for(const [x,z,xx,zz] of lados) {const l=Math.hypot(xx-x,zz-z),n=Math.ceil(l/3),qf=new T.Quaternion().setFromEuler(new T.Euler(0,-Math.atan2(zz-z,xx-x),0));for(let i=0;i<=n;i++) colocar(mourao,[x+(xx-x)*i/n,0,z+(zz-z)*i/n]);for(let i=0;i<n;i++) colocar(painel,[x+(xx-x)*(i+.5)/n,0,z+(zz-z)*(i+.5)/n],[l/n/3,1,1],qf)}
const extras=new T.Group();extras.name='Conexoes_MT';cena.add(extras)
for(const p of PONTOS_CONTINUIDADE_FV.filter(p=>['inversores','trafo','se'].includes(p.id))) {
  caixa(extras,[.12,.12,.06],p.pos,'cobre')
  fio(extras,p.pos,[p.pos[0],.06,p.pos[2]],.015,'cobre')
}
for(const k of [-1,0,1]) {const a=[18+k,10.95,26],b=[16.3+k*.2,3.55,20.8];const curva=new T.CatmullRomCurve3([new T.Vector3(...a as [number,number,number]),new T.Vector3(17+k*.5,6.1,23.4),new T.Vector3(...b as [number,number,number])]);const m=new T.Mesh(new T.TubeGeometry(curva,16,.018,5,false),mats.escuro);extras.add(m)}
for(const x of [-34,-18,10,32]) aviso(extras,[x,1.5,23.025],Math.PI)
// Exportador sem canvas: materiais PBR e geometria, sem dependências de texturas externas.
globalThis.FileReader=class {result:unknown;onloadend?:()=>void;readAsArrayBuffer(b:Blob){b.arrayBuffer().then(r=>{this.result=r;this.onloadend?.()})}} as any
const exporter=new GLTFExporter()
await mkdir('assets-raw/models',{recursive:true})
const manifesto=kit.children.map(g=>{const b=new T.Box3().setFromObject(g);return {nome:g.name,dimensoes:b.getSize(new T.Vector3()).toArray(),min:b.min.toArray(),max:b.max.toArray()}})
for(const [nome,obj] of [['usina-fv',cena],['usina-fv-kit',kit]] as const) {const bin=Buffer.from(await exporter.parseAsync(obj,{binary:true}) as ArrayBuffer);await writeFile(`assets-raw/models/${nome}.glb`,bin);await writeFile(`public/models/${nome}.glb`,bin);console.log(nome,bin.byteLength)}
await writeFile('public/models/usina-fv-kit.json',JSON.stringify({unidade:'metro',eixoVertical:'+Y',origem:'base de cada peça',pecas:manifesto},null,2)+'\n')
console.log('540 módulos, 140 pilares; coordenadas originais preservadas.')
