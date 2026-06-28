import { useState, useCallback, useEffect } from "react";

// ─── Tamaños estándar de pliego en cm ───────────────────────────────────────
const STANDARD_SHEETS = [
  { label: "60×90 cm", w: 60, h: 90 },
  { label: "70×95 cm", w: 70, h: 95 },
  { label: "70×100 cm", w: 70, h: 100 },
  { label: "61×86 cm (Letter)", w: 61, h: 86 },
  { label: "65×95 cm", w: 65, h: 95 },
  { label: "56×86 cm (Tabloide)", w: 56, h: 86 },
];

// ─── Paleta Mr. Blue ─────────────────────────────────────────────────────────
const C = {
  cyan: "#0095D4",
  navy: "#1E3A5F",
  coral: "#EE8B77",
  bg: "#F7F8FA",
  card: "#FFFFFF",
  border: "#E2E6EA",
  text: "#1A2332",
  muted: "#6B7A8D",
  green: "#27AE60",
  amber: "#F39C12",
  red: "#E74C3C",
};

// ─── Estilos base ─────────────────────────────────────────────────────────────
const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  border: `1.5px solid ${C.border}`,
  borderRadius: 7,
  padding: "9px 12px",
  fontSize: 14,
  fontFamily: "Inter, sans-serif",
  color: C.text,
  background: C.card,
  outline: "none",
};
const labelStyle = {
  fontSize: 11,
  fontWeight: 700,
  color: C.muted,
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  marginBottom: 4,
  display: "block",
};
const cardStyle = {
  background: C.card,
  border: `1.5px solid ${C.border}`,
  borderRadius: 10,
  padding: "18px 20px",
  marginBottom: 16,
};

// ─── Cálculo de imposición ───────────────────────────────────────────────────
function calcImposition(sheetW, sheetH, pieceW, pieceH, margin = 0.5) {
  const usableW = sheetW - margin * 2;
  const usableH = sheetH - margin * 2;
  const fitH = Math.floor(usableW / pieceW) * Math.floor(usableH / pieceH);
  const fitV = Math.floor(usableW / pieceH) * Math.floor(usableH / pieceW);
  const bestFit = Math.max(fitH, fitV);
  const orientation = fitH >= fitV ? "horizontal" : "vertical";
  const colsH = Math.floor(usableW / pieceW), rowsH = Math.floor(usableH / pieceH);
  const colsV = Math.floor(usableW / pieceH), rowsV = Math.floor(usableH / pieceW);
  return {
    piecesPerSheet: bestFit,
    orientation,
    cols: orientation === "horizontal" ? colsH : colsV,
    rows: orientation === "horizontal" ? rowsH : rowsV,
  };
}

// ─── Grid Preview ─────────────────────────────────────────────────────────────
function GridPreview({ cols, rows, sheetW, sheetH }) {
  const scale = Math.min(130 / sheetW, 80 / sheetH);
  const sw = sheetW * scale, sh = sheetH * scale;
  const pw = (sheetW / cols) * scale, ph = (sheetH / rows) * scale;
  return (
    <svg width={sw} height={sh} style={{ display: "block", border: `1.5px solid ${C.navy}`, borderRadius: 3, flexShrink: 0 }}>
      <rect width={sw} height={sh} fill="#EAF4FB" />
      {Array.from({ length: cols }).map((_, c) =>
        Array.from({ length: rows }).map((_, r) => (
          <rect key={`${c}-${r}`} x={c * pw + 1} y={r * ph + 1} width={pw - 2} height={ph - 2}
            fill={C.cyan} fillOpacity={0.28} stroke={C.cyan} strokeWidth={0.8} rx={1} />
        ))
      )}
    </svg>
  );
}

// ─── Stat mini ────────────────────────────────────────────────────────────────
function Stat({ label, value, bold, accent }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
      <div style={{ fontWeight: bold ? 700 : 500, color: accent ? C.cyan : C.text, fontFamily: bold ? "'Space Grotesk',sans-serif" : "inherit", fontSize: bold ? 15 : 13 }}>{value}</div>
    </div>
  );
}

// ─── Resultado por tamaño de pliego ──────────────────────────────────────────
function SheetResult({ sheet, result, qty, mermaPercent, pricePerKg, gramaje }) {
  const totalRaw = result.piecesPerSheet > 0 ? Math.ceil(qty / result.piecesPerSheet) : null;
  const totalConMerma = totalRaw ? Math.ceil(totalRaw * (1 + mermaPercent / 100)) : null;
  const mermaExtra = totalConMerma && totalRaw ? totalConMerma - totalRaw : 0;
  const areaM2 = (sheet.w * sheet.h) / 10000;
  const totalKg = totalConMerma ? totalConMerma * (areaM2 * gramaje) / 1000 : null;
  const totalCost = totalKg && pricePerKg ? totalKg * pricePerKg : null;
  const score = result.piecesPerSheet;
  const badgeColor = score >= 8 ? C.green : score >= 4 ? C.amber : C.coral;

  return (
    <div style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: "14px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 14, color: C.navy }}>{sheet.label}</span>
        <span style={{ background: badgeColor, color: "#fff", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>
          {score > 0 ? `${score} pzas/pliego` : "No cabe"}
        </span>
      </div>
      {score > 0 && (
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          <GridPreview cols={result.cols} rows={result.rows} sheetW={sheet.w} sheetH={sheet.h} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px", flex: 1 }}>
            <Stat label="Orientación" value={result.orientation === "horizontal" ? "↔ Horizontal" : "↕ Vertical"} />
            <Stat label="Cols × Filas" value={`${result.cols} × ${result.rows}`} />
            <Stat label="Pliegos netos" value={totalRaw?.toLocaleString("es-MX") ?? "—"} />
            <Stat label="Merma +" value={mermaExtra > 0 ? `+${mermaExtra}` : "0"} />
            <Stat label="Pliegos totales" value={totalConMerma?.toLocaleString("es-MX") ?? "—"} bold />
            <Stat label="Peso estimado" value={totalKg ? `${totalKg.toFixed(1)} kg` : "—"} />
            {totalCost && <Stat label="Costo papel" value={`$${totalCost.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`} bold accent />}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Badge de estado de solicitud ────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    enviado: { label: "Enviado", bg: C.amber, icon: "⏳" },
    respondido: { label: "Respondido", bg: C.green, icon: "✓" },
    vencido: { label: "Sin respuesta", bg: C.red, icon: "⚠" },
  };
  const s = map[status] || map.enviado;
  return (
    <span style={{ background: s.bg, color: "#fff", borderRadius: 20, padding: "2px 9px", fontSize: 11, fontWeight: 700 }}>
      {s.icon} {s.label}
    </span>
  );
}

// ─── Días transcurridos ───────────────────────────────────────────────────────
function diasDesde(isoDate) {
  return Math.floor((Date.now() - new Date(isoDate)) / 86400000);
}

// ─── MÓDULO: Seguimiento de solicitudes ──────────────────────────────────────
function Seguimiento() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get("solicitudes");
        if (r) setSolicitudes(JSON.parse(r.value));
      } catch { /* primera vez, vacío */ }
      setLoading(false);
    })();
  }, []);

  const marcarRespondido = async (id) => {
    const updated = solicitudes.map(s => s.id === id ? { ...s, status: "respondido" } : s);
    setSolicitudes(updated);
    await window.storage.set("solicitudes", JSON.stringify(updated));
  };

  const eliminar = async (id) => {
    const updated = solicitudes.filter(s => s.id !== id);
    setSolicitudes(updated);
    await window.storage.set("solicitudes", JSON.stringify(updated));
  };

  const generarRecordatorio = async (sol) => {
    const prompt = `Escribe un recordatorio CORTO y directo para un proveedor de impresión offset que no ha respondido una solicitud de cotización enviada hace ${diasDesde(sol.fechaEnvio)} días.

Proveedor: ${sol.proveedor}
Producto: ${sol.producto}
Piezas: ${sol.qty?.toLocaleString("es-MX")}
Fecha de solicitud: ${new Date(sol.fechaEnvio).toLocaleDateString("es-MX")}

El tono debe ser amable pero directo. Menos de 5 líneas. Sin firmas largas. Apto para WhatsApp o correo.`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 300, messages: [{ role: "user", content: prompt }] }),
    });
    const data = await res.json();
    return data.content?.map(b => b.text || "").join("") || "";
  };

  const [recordatorioActivo, setRecordatorioActivo] = useState(null);
  const [recordatorioTexto, setRecordatorioTexto] = useState("");
  const [loadingRecordatorio, setLoadingRecordatorio] = useState(false);

  const verRecordatorio = async (sol) => {
    if (recordatorioActivo === sol.id) { setRecordatorioActivo(null); return; }
    setLoadingRecordatorio(true);
    setRecordatorioActivo(sol.id);
    setRecordatorioTexto("");
    const txt = await generarRecordatorio(sol);
    setRecordatorioTexto(txt);
    setLoadingRecordatorio(false);
  };

  if (loading) return <div style={{ color: C.muted, padding: 20, textAlign: "center" }}>Cargando…</div>;

  const pendientes = solicitudes.filter(s => s.status !== "respondido");
  const vencidas = solicitudes.filter(s => s.status !== "respondido" && diasDesde(s.fechaEnvio) >= 2);

  return (
    <div>
      {vencidas.length > 0 && (
        <div style={{ background: "#FFF3CD", border: `1.5px solid ${C.amber}`, borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 13 }}>
          ⚠ <strong>{vencidas.length} proveedor{vencidas.length > 1 ? "es" : ""}</strong> sin respuesta después de 2+ días.
        </div>
      )}

      {solicitudes.length === 0 ? (
        <div style={{ color: C.muted, textAlign: "center", padding: "30px 0", fontSize: 13 }}>
          No hay solicitudes registradas todavía.<br />
          <span style={{ fontSize: 12 }}>Las solicitudes que envíes aparecerán aquí.</span>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {solicitudes.map(sol => {
            const dias = diasDesde(sol.fechaEnvio);
            const efectivoStatus = sol.status === "respondido" ? "respondido" : dias >= 2 ? "vencido" : "enviado";
            return (
              <div key={sol.id} style={{ background: C.card, border: `1.5px solid ${efectivoStatus === "vencido" ? C.red : C.border}`, borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 14, color: C.navy }}>{sol.proveedor}</div>
                    <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{sol.producto} · {sol.qty?.toLocaleString("es-MX")} pzas</div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                      Enviado {new Date(sol.fechaEnvio).toLocaleDateString("es-MX")} · hace {dias} día{dias !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <StatusBadge status={efectivoStatus} />
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                  {efectivoStatus !== "respondido" && (
                    <>
                      <button onClick={() => marcarRespondido(sol.id)} style={btnSmall(C.green)}>✓ Marcar respondido</button>
                      <button onClick={() => verRecordatorio(sol)} style={btnSmall(C.navy)}>
                        {recordatorioActivo === sol.id ? "Cerrar" : "↺ Generar recordatorio"}
                      </button>
                    </>
                  )}
                  {sol.waLink && (
                    <a href={sol.waLink} target="_blank" rel="noreferrer" style={{ ...btnSmall("#25D366"), textDecoration: "none" }}>
                      WhatsApp ↗
                    </a>
                  )}
                  <button onClick={() => eliminar(sol.id)} style={btnSmall(C.red)}>Eliminar</button>
                </div>

                {recordatorioActivo === sol.id && (
                  <div style={{ marginTop: 12, background: "#F0F7FF", border: `1.5px solid ${C.cyan}`, borderRadius: 8, padding: 12, fontSize: 13, position: "relative" }}>
                    {loadingRecordatorio ? (
                      <span style={{ color: C.muted }}>Generando recordatorio…</span>
                    ) : (
                      <>
                        <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{recordatorioTexto}</div>
                        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                          <button onClick={() => navigator.clipboard.writeText(recordatorioTexto)} style={btnSmall(C.cyan)}>Copiar</button>
                          {sol.waLink && (
                            <a href={`https://wa.me/?text=${encodeURIComponent(recordatorioTexto)}`} target="_blank" rel="noreferrer" style={{ ...btnSmall("#25D366"), textDecoration: "none" }}>
                              Enviar por WA ↗
                            </a>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function btnSmall(bg) {
  return {
    background: bg,
    color: "#fff",
    border: "none",
    borderRadius: 6,
    padding: "5px 12px",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "'Space Grotesk',sans-serif",
  };
}

// ─── MÓDULO: Envío de solicitud ───────────────────────────────────────────────
function EnvioSolicitud({ calcData }) {
  const [proveedores, setProveedores] = useState([{ nombre: "", email: "", telefono: "" }]);
  const [desc, setDesc] = useState("");
  const [producto, setProducto] = useState("");
  const [resendKey, setResendKey] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [mensajeGenerado, setMensajeGenerado] = useState("");
  const [loadingMsg, setLoadingMsg] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [resultados, setResultados] = useState([]);
  const [showConfig, setShowConfig] = useState(false);

  const addProveedor = () => setProveedores([...proveedores, { nombre: "", email: "", telefono: "" }]);
  const updateProveedor = (i, field, val) => {
    const p = [...proveedores]; p[i][field] = val; setProveedores(p);
  };
  const removeProveedor = (i) => setProveedores(proveedores.filter((_, idx) => idx !== i));

  const best = calcData?.raw?.[0];
  const bestLabel = best?.sheet.label ?? "—";
  const bestTotal = best && calcData ? Math.ceil(Math.ceil(calcData.qty / best.result.piecesPerSheet) * (1 + calcData.merma / 100)) : null;

  const generarMensaje = async () => {
    setLoadingMsg(true);
    setMensajeGenerado("");
    const prompt = `Eres el asistente de cotizaciones de Mr. Blue Laboratorios Creativos (CDMX, merchandise B2B).

Genera un mensaje profesional y directo para solicitar cotización a un proveedor de impresión offset.
Tuteo formal. Sin introducciones largas. Sin despedidas elaboradas.

PRODUCTO: ${producto || desc}
DESCRIPCIÓN DEL CLIENTE: ${desc}
MEDIDA A CORTE: ${calcData ? `${calcData.pw} × ${calcData.ph} cm` : "por definir"}
CANTIDAD DE PIEZAS: ${calcData ? calcData.qty.toLocaleString("es-MX") : "por definir"}
MEJOR PLIEGO: ${bestLabel}
PLIEGOS ESTIMADOS (con merma ${calcData?.merma ?? 5}%): ${bestTotal?.toLocaleString("es-MX") ?? "por calcular"}
GRAMAJE: ${calcData?.gramaje ?? "—"} g/m²

Solicita: precio por millar o por pieza, tiempo de entrega, si incluye barniz UV/plastificado, y datos de facturación si aplica.
El mensaje debe poder copiarse directo a WhatsApp o usarse como cuerpo de correo.`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 600, messages: [{ role: "user", content: prompt }] }),
    });
    const data = await res.json();
    setMensajeGenerado(data.content?.map(b => b.text || "").join("") || "Error al generar.");
    setLoadingMsg(false);
  };

  const enviarTodo = async () => {
    if (!mensajeGenerado || proveedores.every(p => !p.nombre)) return;
    setEnviando(true);
    const res = [];

    for (const prov of proveedores) {
      if (!prov.nombre) continue;
      const entry = { proveedor: prov.nombre, canales: [] };

      // ── Correo vía Resend ──
      if (prov.email && resendKey && fromEmail) {
        try {
          const r = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${resendKey}` },
            body: JSON.stringify({
              from: fromEmail,
              to: prov.email,
              subject: `Solicitud de cotización – ${producto || "Producto offset"} | Mr. Blue`,
              text: mensajeGenerado,
            }),
          });
          entry.canales.push(r.ok ? "✓ Correo enviado" : `✗ Correo: error ${r.status}`);
        } catch (e) {
          entry.canales.push(`✗ Correo: ${e.message}`);
        }
      } else if (prov.email) {
        entry.canales.push("— Correo: sin API key configurada");
      }

      // ── WhatsApp link ──
      let waLink = null;
      if (prov.telefono) {
        const num = prov.telefono.replace(/\D/g, "");
        waLink = `https://wa.me/${num.startsWith("52") ? num : "52" + num}?text=${encodeURIComponent(mensajeGenerado)}`;
        entry.canales.push("↗ Link WhatsApp generado");
        entry.waLink = waLink;
      }

      res.push(entry);

      // ── Guardar en storage ──
      try {
        const existing = await window.storage.get("solicitudes").catch(() => null);
        const lista = existing ? JSON.parse(existing.value) : [];
        lista.unshift({
          id: Date.now() + Math.random(),
          proveedor: prov.nombre,
          email: prov.email,
          telefono: prov.telefono,
          producto: producto || "Sin nombre",
          qty: calcData?.qty,
          fechaEnvio: new Date().toISOString(),
          status: "enviado",
          waLink,
        });
        await window.storage.set("solicitudes", JSON.stringify(lista));
      } catch { /* storage no disponible */ }
    }

    setResultados(res);
    setEnviando(false);
  };

  return (
    <div>
      {/* Config Resend */}
      <div style={{ ...cardStyle, borderColor: showConfig ? C.cyan : C.border }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 13, color: C.navy }}>⚙ Configuración de envío</span>
          <button onClick={() => setShowConfig(!showConfig)} style={{ background: "none", border: "none", cursor: "pointer", color: C.cyan, fontSize: 13, fontWeight: 700 }}>
            {showConfig ? "Cerrar ▲" : "Configurar ▼"}
          </button>
        </div>
        {showConfig && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 14 }}>
            <div>
              <label style={labelStyle}>API Key de Resend</label>
              <input value={resendKey} onChange={e => setResendKey(e.target.value)} type="password"
                placeholder="re_xxxxxxxxxxxx" style={inputStyle} />
              <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
                Obtén tu key en <a href="https://resend.com" target="_blank" rel="noreferrer" style={{ color: C.cyan }}>resend.com</a> (plan gratuito: 3,000 correos/mes)
              </div>
            </div>
            <div>
              <label style={labelStyle}>Tu correo remitente (verificado en Resend)</label>
              <input value={fromEmail} onChange={e => setFromEmail(e.target.value)}
                placeholder="cotizaciones@mrblue.com.mx" style={inputStyle} />
            </div>
          </div>
        )}
      </div>

      {/* Datos del producto */}
      <div style={cardStyle}>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 13, color: C.navy, marginBottom: 14 }}>Producto a cotizar</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={labelStyle}>Nombre del producto</label>
            <input value={producto} onChange={e => setProducto(e.target.value)} placeholder="Ej: Caja plegadiza 4/0, Folleto 4/4…" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Descripción del correo del cliente</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)}
              placeholder="Pega aquí la descripción del cliente: tipo de producto, colores, acabados, uso, material preferido…"
              style={{ ...inputStyle, height: 80, resize: "vertical" }} />
          </div>
          {calcData && (
            <div style={{ background: "#EAF4FB", borderRadius: 7, padding: "10px 14px", fontSize: 12, color: C.navy }}>
              📐 <strong>Datos de la calculadora:</strong> {calcData.pw}×{calcData.ph} cm · {calcData.qty.toLocaleString("es-MX")} pzas · {bestLabel} · {bestTotal?.toLocaleString("es-MX")} pliegos
            </div>
          )}
          <button onClick={generarMensaje} disabled={loadingMsg || (!desc && !producto)}
            style={{ background: loadingMsg ? C.muted : C.navy, color: "#fff", border: "none", borderRadius: 8, padding: "10px 0", fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            {loadingMsg ? "Generando mensaje…" : "✦ Generar mensaje de cotización"}
          </button>
        </div>
      </div>

      {/* Mensaje generado */}
      {mensajeGenerado && (
        <div style={{ ...cardStyle, borderColor: C.cyan }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 13, color: C.navy }}>Mensaje generado</span>
            <button onClick={() => navigator.clipboard.writeText(mensajeGenerado)} style={btnSmall(C.cyan)}>Copiar</button>
          </div>
          <textarea value={mensajeGenerado} onChange={e => setMensajeGenerado(e.target.value)}
            style={{ ...inputStyle, height: 160, resize: "vertical", fontSize: 13, lineHeight: 1.6 }} />
          <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>Puedes editar el texto antes de enviar.</div>
        </div>
      )}

      {/* Proveedores */}
      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 13, color: C.navy }}>Proveedores destinatarios</span>
          <button onClick={addProveedor} style={btnSmall(C.cyan)}>+ Agregar</button>
        </div>
        {proveedores.map((p, i) => (
          <div key={i} style={{ background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: 8, padding: "12px 14px", marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: C.navy }}>Proveedor {i + 1}</span>
              {proveedores.length > 1 && <button onClick={() => removeProveedor(i)} style={{ background: "none", border: "none", cursor: "pointer", color: C.red, fontWeight: 700, fontSize: 13 }}>✕</button>}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px 10px" }}>
              <div>
                <label style={labelStyle}>Nombre</label>
                <input value={p.nombre} onChange={e => updateProveedor(i, "nombre", e.target.value)} placeholder="Imprenta López" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Correo</label>
                <input value={p.email} onChange={e => updateProveedor(i, "email", e.target.value)} placeholder="ventas@imprenta.mx" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>WhatsApp (10 dígitos)</label>
                <input value={p.telefono} onChange={e => updateProveedor(i, "telefono", e.target.value)} placeholder="5512345678" style={inputStyle} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Botón enviar */}
      {mensajeGenerado && proveedores.some(p => p.nombre) && (
        <button onClick={enviarTodo} disabled={enviando}
          style={{ background: enviando ? C.muted : C.coral, color: "#fff", border: "none", borderRadius: 8, padding: "13px 0", fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 15, cursor: "pointer", width: "100%", marginBottom: 16 }}>
          {enviando ? "Enviando…" : `✉ Enviar solicitud a ${proveedores.filter(p => p.nombre).length} proveedor${proveedores.filter(p => p.nombre).length > 1 ? "es" : ""}`}
        </button>
      )}

      {/* Resultados */}
      {resultados.length > 0 && (
        <div style={{ ...cardStyle, borderColor: C.green }}>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 13, color: C.navy, marginBottom: 12 }}>Resultado del envío</div>
          {resultados.map((r, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{r.proveedor}</div>
              {r.canales.map((c, j) => <div key={j} style={{ fontSize: 12, color: C.muted, marginLeft: 8 }}>{c}</div>)}
              {r.waLink && (
                <a href={r.waLink} target="_blank" rel="noreferrer"
                  style={{ display: "inline-block", marginTop: 6, background: "#25D366", color: "#fff", borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
                  Abrir WhatsApp ↗
                </a>
              )}
            </div>
          ))}
          <div style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>Las solicitudes fueron registradas en Seguimiento.</div>
        </div>
      )}
    </div>
  );
}

// ─── MÓDULO: Calculadora ──────────────────────────────────────────────────────
function Calculadora({ onCalcDone }) {
  const [pw, setPw] = useState("10");
  const [ph, setPh] = useState("7");
  const [qty, setQty] = useState("1000");
  const [merma, setMerma] = useState("5");
  const [gramaje, setGramaje] = useState("300");
  const [pricePerKg, setPricePerKg] = useState("");
  const [results, setResults] = useState(null);

  const calcular = () => {
    const pw_ = parseFloat(pw), ph_ = parseFloat(ph), qty_ = parseInt(qty);
    const merma_ = parseFloat(merma) || 0, gramaje_ = parseFloat(gramaje) || 300, pkkg = parseFloat(pricePerKg) || 0;
    if (!pw_ || !ph_ || !qty_) return;
    const raw = STANDARD_SHEETS.map(sheet => ({ sheet, result: calcImposition(sheet.w, sheet.h, pw_, ph_) }))
      .sort((a, b) => b.result.piecesPerSheet - a.result.piecesPerSheet);
    const res = { pw: pw_, ph: ph_, qty: qty_, merma: merma_, gramaje: gramaje_, pricePerKg: pkkg, raw };
    setResults(res);
    onCalcDone(res);
  };

  const best = results?.raw?.[0];
  const bestTotal = best?.result.piecesPerSheet > 0
    ? Math.ceil(Math.ceil(results.qty / best.result.piecesPerSheet) * (1 + results.merma / 100)) : null;

  return (
    <div>
      <div style={cardStyle}>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 13, color: C.navy, marginBottom: 14 }}>Datos del producto</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 16px" }}>
          {[["Ancho a corte (cm)", pw, setPw], ["Alto a corte (cm)", ph, setPh],
            ["Número de piezas", qty, setQty], ["Merma (%)", merma, setMerma],
            ["Gramaje (g/m²)", gramaje, setGramaje]].map(([lbl, val, set]) => (
            <div key={lbl}>
              <label style={labelStyle}>{lbl}</label>
              <input value={val} onChange={e => set(e.target.value)} style={inputStyle} type="number" step="0.1" />
            </div>
          ))}
          <div>
            <label style={labelStyle}>Precio/kg papel ($) <span style={{ color: C.muted, fontWeight: 400, textTransform: "none" }}>opcional</span></label>
            <input value={pricePerKg} onChange={e => setPricePerKg(e.target.value)} style={inputStyle} type="number" step="0.01" placeholder="42.50" />
          </div>
        </div>
        <button onClick={calcular} style={{ marginTop: 16, background: C.cyan, color: "#fff", border: "none", borderRadius: 8, padding: "11px 0", fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 14, cursor: "pointer", width: "100%" }}>
          Calcular imposición →
        </button>
      </div>

      {results && (
        <>
          <div style={{ background: C.navy, borderRadius: 10, padding: "12px 18px", marginBottom: 14, display: "flex", gap: 24, flexWrap: "wrap" }}>
            {[["Mejor opción", best.sheet.label], ["Pzas/pliego", best.result.piecesPerSheet], ["Pliegos totales", bestTotal?.toLocaleString("es-MX") ?? "—"]].map(([l, v]) => (
              <div key={l}>
                <div style={{ fontSize: 10, color: "#8BBDD6", textTransform: "uppercase", letterSpacing: "0.05em" }}>{l}</div>
                <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 17, color: "#fff" }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
            {results.raw.map(({ sheet, result }) => (
              <SheetResult key={sheet.label} sheet={sheet} result={result} qty={results.qty}
                mermaPercent={results.merma} pricePerKg={results.pricePerKg} gramaje={results.gramaje} />
            ))}
          </div>
          <div style={{ background: "#FFF7F5", border: `1.5px solid ${C.coral}`, borderRadius: 8, padding: "9px 13px", fontSize: 11.5, color: C.muted }}>
            💡 Margen de seguridad: 0.5 cm por lado (gripper + sangría). Mayor rendimiento aparece primero.
          </div>
        </>
      )}
    </div>
  );
}

// ─── APP PRINCIPAL ────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("calc");
  const [calcData, setCalcData] = useState(null);

  const tabs = [
    { key: "calc", label: "📐 Pliegos" },
    { key: "envio", label: "✉ Enviar solicitud" },
    { key: "seg", label: "📋 Seguimiento" },
  ];

  return (
    <div style={{ fontFamily: "Inter, sans-serif", background: C.bg, minHeight: "100vh", color: C.text }}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ background: C.navy, padding: "14px 20px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 7, height: 26, background: C.cyan, borderRadius: 2 }} />
        <div>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, color: "#fff", fontSize: 16 }}>
            Mr. Blue · Cotizador Offset
          </div>
          <div style={{ fontSize: 11, color: "#8BBDD6" }}>Pliegos · Envío a proveedores · Seguimiento</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: `2px solid ${C.border}`, background: C.card, paddingLeft: 16 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            background: "none", border: "none",
            borderBottom: tab === t.key ? `3px solid ${C.cyan}` : "3px solid transparent",
            padding: "11px 16px", fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 13,
            color: tab === t.key ? C.cyan : C.muted, cursor: "pointer", marginBottom: -2,
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{ maxWidth: 740, margin: "0 auto", padding: "20px 14px" }}>
        {tab === "calc" && (
          <>
            <Calculadora onCalcDone={setCalcData} />
            {calcData && (
              <button onClick={() => setTab("envio")} style={{ background: C.coral, color: "#fff", border: "none", borderRadius: 8, padding: "12px 0", fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 14, cursor: "pointer", width: "100%", marginTop: 4 }}>
                Continuar → Enviar solicitud a proveedores
              </button>
            )}
          </>
        )}
        {tab === "envio" && <EnvioSolicitud calcData={calcData} />}
        {tab === "seg" && <Seguimiento />}
      </div>
    </div>
  );
}
