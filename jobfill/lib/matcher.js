// Reglas de coincidencia campo -> clave del perfil. Orden = prioridad (lo específico primero).
// Cada patrón se prueba contra el "haystack" normalizado (label + placeholder + name + id + aria + autocomplete).
(function (root) {
  const RULES = [
    ['email', /e-?mail|correo/],
    ['phone', /phone|tel[eé]fono|mobile|celular|m[oó]vil|whatsapp/],
    ['linkedin', /linked-?in/],
    ['github', /git-?hub/],
    ['portfolio', /portfolio|portafolio/],
    ['website', /website|web ?site|sitio web|personal (site|url)|^url$/],
    ['firstName', /first.?name|given.?name|nombres?$|primer nombre|fname/],
    ['lastName', /last.?name|family.?name|surname|apellidos?|lname/],
    ['fullName', /full.?name|your name|nombre completo|^name$|^nombre$|legal name/],
    ['zip', /zip|postal|c[oó]digo postal/],
    ['city', /\bcity\b|ciudad|town/],
    ['state', /\bstate\b|province|provincia|estado|region|departamento/],
    ['country', /country|pa[ií]s|nationality|nacionalidad/],
    ['address', /address|direcci[oó]n|street|calle/],
    ['currentCompany', /current (company|employer)|employer|empresa actual|company name|organization/],
    ['currentTitle', /current (title|position|role)|job title|cargo actual|puesto actual|position title/],
    ['yearsExperience', /years? of (relevant |total |professional )?experience|a[nñ]os de experiencia/],
    ['salaryExpectation', /salary|compensation|remuneraci[oó]n|expectativa salarial|pretensi[oó]n|desired pay/],
    ['noticePeriod', /notice period|availability|available to start|start date|when can you start|disponibilidad|fecha de inicio/],
    ['school', /school|university|universidad|college|institution|instituci[oó]n/],
    ['degree', /degree|t[ií]tulo|grado acad/],
    ['fieldOfStudy', /field of study|major|discipline|carrera|especialidad/],
    ['gradYear', /graduation|grad(uation)? year|a[nñ]o de graduaci[oó]n/],
    ['coverLetter', /cover.?letter|carta de presentaci[oó]n|motivation|why (do you want|are you interested)|por qu[eé] te interesa/],
    ['summary', /summary|about you|tell us about|bio\b|resumen|sobre ti|additional information|informaci[oó]n adicional/],
  ];

  // Preguntas sí/no -> clave booleana del perfil
  const YESNO = [
    ['requiresSponsorship', /sponsor|visa|patrocinio/],
    ['workAuthorization', /authori[sz]ed|legally|eligible to work|right to work|work permit|autorizad|permiso de trabajo/],
    ['willingRelocate', /relocat|reubicar|mudar/],
    ['remoteOk', /remote|remoto|hybrid|h[ií]brido/],
    ['over18', /18 years|mayor de edad|18 a[nñ]os/],
  ];

  const norm = (s) =>
    (s || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quita acentos (ñ -> n)
      .replace(/[*:_\-]+/g, ' ').replace(/\s+/g, ' ').trim();

  function matchKey(hay) {
    const h = norm(hay);
    if (!h) return null;
    for (const [key, re] of RULES) if (re.test(h)) return key;
    return null;
  }
  function matchYesNo(hay) {
    const h = norm(hay);
    for (const [key, re] of YESNO) if (re.test(h)) return key;
    return null;
  }

  root.JobFillMatcher = { matchKey, matchYesNo, norm };
})(typeof window !== 'undefined' ? window : globalThis);
