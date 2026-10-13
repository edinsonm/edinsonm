// Motor de autofill: detecta campos, los empareja con el perfil y los rellena.
(function () {
  if (window.__jobfillLoaded) return;
  window.__jobfillLoaded = true;
  const { matchKey, matchYesNo, norm } = window.JobFillMatcher;

  // ---------- Utilidades de DOM ----------
  const isVisible = (el) => {
    const r = el.getBoundingClientRect();
    const st = getComputedStyle(el);
    return (r.width > 0 || r.height > 0) && st.visibility !== 'hidden' && st.display !== 'none';
  };

  // querySelectorAll que atraviesa shadow roots abiertos
  function deepQueryAll(sel, root = document, out = []) {
    root.querySelectorAll(sel).forEach((e) => out.push(e));
    root.querySelectorAll('*').forEach((e) => { if (e.shadowRoot) deepQueryAll(sel, e.shadowRoot, out); });
    return out;
  }

  // Setter nativo + eventos para que React/Vue/Angular detecten el cambio
  function setValue(el, value) {
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype
      : el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    el.focus();
    setter ? setter.call(el, value) : (el.value = value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));
  }

  function labelText(el) {
    const parts = [];
    if (el.labels) el.labels.forEach((l) => parts.push(l.innerText));
    const lb = el.getAttribute('aria-labelledby');
    if (lb) lb.split(/\s+/).forEach((id) => parts.push(document.getElementById(id)?.innerText));
    parts.push(el.getAttribute('aria-label'));
    if (!parts.filter(Boolean).length) {
      // Fallback: label ancestro o texto del contenedor cercano
      const wrap = el.closest('label') || el.closest('[class*="field"],[class*="question"],[class*="form-group"],fieldset,li,div');
      if (wrap && wrap.innerText && wrap.innerText.length < 200) parts.push(wrap.innerText);
    }
    return parts.filter(Boolean).join(' ');
  }

  function haystack(el) {
    return [
      labelText(el), el.placeholder, el.name, el.id, el.getAttribute('autocomplete'),
      el.getAttribute('data-qa'), el.getAttribute('data-automation-id'), el.title,
    ].filter(Boolean).join(' ');
  }

  const AUTOCOMPLETE = {
    'given-name': 'firstName', 'family-name': 'lastName', name: 'fullName', email: 'email', tel: 'phone',
    'tel-national': 'phone', 'street-address': 'address', 'address-line1': 'address', 'address-level2': 'city',
    'address-level1': 'state', 'postal-code': 'zip', country: 'country', 'country-name': 'country',
    organization: 'currentCompany', 'organization-title': 'currentTitle', url: 'website',
  };

  // ---------- Resolución de valores ----------
  function valueFor(key, p) {
    switch (key) {
      case 'fullName': return [p.firstName, p.lastName].filter(Boolean).join(' ');
      case 'portfolio': return p.portfolio || p.website;
      case 'website': return p.website || p.portfolio;
      case 'fieldOfStudy': return p.fieldOfStudy;
      default: return p[key];
    }
  }

  function fillSelect(el, value) {
    const v = norm(value);
    const opts = [...el.options].filter((o) => o.value !== '');
    const best = opts.find((o) => norm(o.text) === v || norm(o.value) === v)
      || opts.find((o) => norm(o.text).includes(v) || (norm(o.text).length > 2 && v.includes(norm(o.text))));
    if (!best) return false;
    setValue(el, best.value);
    return true;
  }

  function yesNoAnswer(key, p) {
    const raw = p[key];
    if (raw === undefined || raw === '' || raw === null) return null;
    const s = norm(raw);
    return ['yes', 'si', 'true', '1', 'y'].includes(s) ? 'yes' : 'no';
  }

  // ---------- Relleno principal ----------
  async function autofill(profile, cvFile) {
    const report = { filled: 0, skipped: [], filledLabels: [] };
    const mark = (el, label) => {
      el.style.outline = '2px solid #22c55e';
      el.style.outlineOffset = '1px';
      report.filled++;
      report.filledLabels.push(label);
    };

    const fields = deepQueryAll('input, textarea, select').filter(
      (el) => !['hidden', 'submit', 'button', 'image', 'reset', 'password', 'search'].includes(el.type) && isVisible(el) && !el.disabled,
    );
    const handledRadioGroups = new Set();

    for (const el of fields) {
      try {
        // --- Archivos: subir CV ---
        if (el.type === 'file') {
          const h = norm(haystack(el));
          if (cvFile && /resume|cv|curriculum|curr[ií]culum/.test(h) && !/cover/.test(h)) {
            const bin = Uint8Array.from(atob(cvFile.base64), (c) => c.charCodeAt(0));
            const file = new File([bin], cvFile.name, { type: cvFile.type || 'application/pdf' });
            const dt = new DataTransfer();
            dt.items.add(file);
            el.files = dt.files;
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
            mark(el.closest('div') || el, 'CV (archivo)');
          }
          continue;
        }

        // --- Radios (preguntas sí/no) ---
        if (el.type === 'radio') {
          const gname = el.name || el.id;
          if (handledRadioGroups.has(gname)) continue;
          handledRadioGroups.add(gname);
          const group = [...document.querySelectorAll(`input[type=radio][name="${CSS.escape(el.name)}"]`)];
          const question = el.closest('fieldset')?.querySelector('legend')?.innerText
            || el.closest('[role=radiogroup]')?.getAttribute('aria-label')
            || (el.closest('fieldset,[role=radiogroup],div')?.parentElement?.innerText || '').slice(0, 250);
          const key = matchYesNo(question);
          const ans = key && yesNoAnswer(key, profile);
          if (!ans) { report.skipped.push(question.slice(0, 60)); continue; }
          const pick = group.find((r) => {
            const t = norm(labelText(r) + ' ' + r.value);
            return ans === 'yes' ? /\b(yes|si|true)\b/.test(t) : /\b(no|false)\b/.test(t);
          });
          if (pick) { pick.click(); mark(pick.parentElement || pick, question.slice(0, 40)); }
          continue;
        }

        // --- Checkbox: sólo preguntas sí/no con un solo checkbox ---
        if (el.type === 'checkbox') continue;

        if (el.value && el.value.trim() && !el.dataset.jobfillForce) continue; // no pisar lo que ya hay

        const hay = haystack(el);
        let key = AUTOCOMPLETE[el.getAttribute('autocomplete')] || matchKey(hay);

        // Pregunta sí/no en select
        if (el.tagName === 'SELECT') {
          const yn = matchYesNo(hay);
          const ans = yn && yesNoAnswer(yn, profile);
          if (ans) {
            if (fillSelect(el, ans === 'yes' ? 'yes' : 'no') || fillSelect(el, ans === 'yes' ? 'si' : 'no')) mark(el, hay.slice(0, 40));
            continue;
          }
        }

        if (!key) { if (hay.trim()) report.skipped.push(norm(hay).slice(0, 60)); continue; }
        const value = valueFor(key, profile);
        if (value === undefined || value === '') { report.skipped.push(`${key} (vacío en perfil)`); continue; }

        if (el.tagName === 'SELECT') {
          if (fillSelect(el, value)) mark(el, key);
          else report.skipped.push(`${key}: sin opción "${value}"`);
        } else {
          setValue(el, String(value));
          mark(el, key);
        }
      } catch (e) {
        report.skipped.push('error: ' + e.message);
      }
    }
    return report;
  }

  async function run() {
    const { profile, cv } = await chrome.storage.local.get(['profile', 'cv']);
    if (!profile) return { error: 'No hay perfil guardado. Abre las opciones de JobFill.' };
    return autofill(profile, cv);
  }

  // Expuesto para chrome.scripting.executeScript (mismo mundo aislado) -> un reporte por frame
  window.__jobfillRun = run;
})();
