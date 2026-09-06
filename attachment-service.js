/**
 * attachment-service.js
 *
 * Abstração de armazenamento de anexos (fotos da escola, cartografia participativa,
 * evidências fotográficas/documentais). Usa IndexedDB — armazenamento local do
 * próprio navegador, sem backend/servidor remoto — para não estourar a cota
 * pequena do localStorage (~5–10MB) quando o cursista anexa imagens.
 *
 * O restante do diagnóstico (todas as respostas estruturadas) continua em
 * localStorage, conforme especificado. Esta é uma decisão puramente técnica,
 * documentada e sem impacto metodológico: o diagnóstico exportado em JSON
 * embute os anexos referenciados como base64, preservando a portabilidade
 * (seção 7) mesmo com os blobs vivendo fora do localStorage.
 *
 * Se no futuro for necessário armazenamento remoto real, apenas esta camada
 * precisa mudar — nenhuma tela ou regra depende do mecanismo de guarda.
 */

const DB_NAME = "secadiAttachments";
const DB_VERSION = 1;
const STORE_NAME = "files";
const MAX_FILE_BYTES = 4 * 1024 * 1024; // 4MB por arquivo — limite razoável para protótipo local

let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error("IndexedDB indisponível neste navegador."));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function saveFile(file, meta = {}) {
  if (!file) return null;
  if (file.size > MAX_FILE_BYTES) {
    throw new Error(
      `Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(1)}MB). Limite: ${MAX_FILE_BYTES / 1024 / 1024}MB.`
    );
  }
  const dataUrl = await readFileAsDataUrl(file);
  return saveDataUrl(dataUrl, { name: file.name, type: file.type, size: file.size, ...meta });
}

async function saveDataUrl(dataUrl, meta = {}) {
  const db = await openDb();
  const id = window.DataModel.uid("ATT");
  const record = {
    id,
    name: meta.name || "arquivo",
    type: meta.type || "application/octet-stream",
    size: meta.size || dataUrl.length,
    dataUrl,
    createdAt: new Date().toISOString(),
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(record);
    tx.oncomplete = () => resolve(id);
    tx.onerror = () => reject(tx.error);
  });
}

async function getFile(id) {
  if (!id) return null;
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

async function deleteFile(id) {
  if (!id) return;
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function exportAsBase64Map(ids) {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  const out = {};
  for (const id of uniqueIds) {
    const record = await getFile(id);
    if (record) out[id] = record;
  }
  return out;
}

async function importBase64Map(map) {
  const db = await openDb();
  const entries = Object.entries(map || {});
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    entries.forEach(([id, record]) => store.put({ ...record, id }));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

window.attachmentService = {
  MAX_FILE_BYTES,
  saveFile,
  saveDataUrl,
  getFile,
  deleteFile,
  exportAsBase64Map,
  importBase64Map,
};
