const SECTIONS = {
  personal: [['firstName','Nombre'],['lastName','Apellido'],['email','Email','email'],['phone','Teléfono'],
    ['address','Dirección'],['city','Ciudad'],['state','Estado / Provincia'],['zip','Código postal'],['country','País'],
    ['linkedin','LinkedIn URL'],['github','GitHub URL'],['website','Sitio web'],['portfolio','Portafolio']],
  work: [['currentCompany','Empresa actual'],['currentTitle','Cargo actual'],['yearsExperience','Años de experiencia'],
    ['salaryExpectation','Expectativa salarial'],['noticePeriod','Disponibilidad / aviso previo']],
  yn: [['workAuthorization','¿Autorizado a trabajar en el país?'],['requiresSponsorship','¿Requiere sponsorship de visa?'],
    ['willingRelocate','¿Dispuesto a reubicarte?'],['remoteOk','¿Cómodo con trabajo remoto?'],['over18','¿Mayor de 18?']],
  edu: [['school','Universidad'],['degree','Título'],['fieldOfStudy','Carrera'],['gradYear','Año de graduación']],
  text: [['summary','Resumen profesional','area'],['coverLetter','Carta de presentación base','area']],
};
const KEYS = [];
for (const [sec, fields] of Object.entries(SECTIONS)) {
  const host = document.getElementById(sec);
  for (const [key, label, type] of fields) {
    KEYS.push(key);
    const l = document.createElement('label');
    l.textContent = label;
    let inp;
    if (sec === 'yn') {
      inp = document.createElement('select');
      inp.innerHTML = '<option value="">(sin responder)</option><option value="yes">Sí</option><option value="no">No</option>';
    } else if (type === 'area') { inp = document.createElement('textarea'); l.className = 'full'; }
    else { inp = document.createElement('input'); inp.type = type || 'text'; }
    inp.name = key;
    l.appendChild(inp);
    host.appendChild(l);
  }
}
const f = document.getElementById('f');
const msg = (t) => { const m = document.getElementById('msg'); m.textContent = t; setTimeout(() => (m.textContent = ''), 2500); };

async function load() {
  const { profile = {}, cv } = await chrome.storage.local.get(['profile', 'cv']);
  KEYS.forEach((k) => { if (f.elements[k]) f.elements[k].value = profile[k] ?? ''; });
  document.getElementById('cvname').textContent = cv ? `Guardado: ${cv.name}` : '';
}
const collect = () => Object.fromEntries(KEYS.map((k) => [k, f.elements[k].value.trim()]));

f.addEventListener('submit', async (e) => {
  e.preventDefault();
  await chrome.storage.local.set({ profile: collect() });
  msg('Guardado ✔');
});

document.getElementById('cvfile').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const buf = new Uint8Array(await file.arrayBuffer());
  let bin = ''; for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  await chrome.storage.local.set({ cv: { name: file.name, type: file.type, base64: btoa(bin) } });
  document.getElementById('cvname').textContent = `Guardado: ${file.name}`;
});

document.getElementById('export').onclick = () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(collect(), null, 2)], { type: 'application/json' }));
  a.download = 'jobfill-profile.json';
  a.click();
};
document.getElementById('import').onclick = () => document.getElementById('importfile').click();
document.getElementById('importfile').addEventListener('change', async (e) => {
  try {
    const data = JSON.parse(await e.target.files[0].text());
    KEYS.forEach((k) => { if (data[k] !== undefined) f.elements[k].value = data[k]; });
    msg('Importado — pulsa Guardar');
  } catch { msg('JSON inválido'); }
});
load();
