
import React, { useState } from 'react';
import { Save, Copy, CheckCircle2, AlertCircle, Database } from 'lucide-react';

interface SheetConfigProps {
  onSave: () => void;
}

const SheetConfig: React.FC<SheetConfigProps> = ({ onSave }) => {
  const [url, setUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const APPS_SCRIPT_CODE = `
// *** CÓDIGO GOOGLE APPS SCRIPT PARA FLOOR DEPOT v13 (CASE INSENSITIVE) ***
// Soluciona definitivamente problemas de mayúsculas/minúsculas en encabezados.

function doGet(e) { return handleRequest(e); }
function doPost(e) { return handleRequest(e); }

function handleRequest(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000); 
  
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Productos');
    
    // 1. AUTO-SETUP
    if (!sheet) {
      sheet = ss.insertSheet('Productos');
      sheet.appendRow(['id', 'name', 'category', 'format', 'yield', 'price', 'finish', 'code', 'description', 'images', 'cost', 'provider', 'createdAt', 'isFeatured']);
    }

    // 2. MAPEO DE COLUMNAS (TODO A MINÚSCULAS)
    // Esto asegura que 'isFeatured', 'IsFeatured' y 'isfeatured' sean lo mismo.
    var range = sheet.getDataRange();
    var data = range.getValues();
    var headers = data[0].map(function(h) { return String(h).trim().toLowerCase(); });
    
    // Verificar si existe la columna de destacados (buscando 'isfeatured')
    var featIndex = headers.indexOf('isfeatured');
    if (featIndex === -1) {
      sheet.getRange(1, headers.length + 1).setValue('isFeatured'); // Escribimos bonito, pero leemos en minúscula
      SpreadsheetApp.flush();
      // Recargar headers
      range = sheet.getDataRange();
      data = range.getValues();
      headers = data[0].map(function(h) { return String(h).trim().toLowerCase(); });
      featIndex = headers.indexOf('isfeatured');
    }

    var idIndex = headers.indexOf('id');
    if (idIndex === -1) return errorResponse("Falta columna ID en la planilla");

    // Parsear Datos Request
    var action = e.parameter.action;
    var requestData = {};
    if (e.postData && e.postData.contents) {
      try {
        requestData = JSON.parse(e.postData.contents);
        if (requestData.action) action = requestData.action;
      } catch (ex) {}
    }

    // --- READ (LEER) ---
    if (!action || action === 'read') {
      var result = [];
      for (var i = 1; i < data.length; i++) {
        var row = data[i];
        // Si la fila está vacía o no tiene ID, saltar
        if (!row[idIndex] || String(row[idIndex]).trim() === '') continue;
        
        var obj = {};
        for (var j = 0; j < headers.length; j++) {
          if(headers[j]) {
             // Las claves del objeto JSON serán todas minúsculas (ej: obj.isfeatured)
             obj[headers[j]] = row[j]; 
          }
        }
        result.push(obj);
      }
      return successResponse({ data: result });
    }

    // --- CREATE (CREAR) ---
    if (action === 'create') {
      var p = requestData.data;
      var newRow = [];
      
      for (var i = 0; i < headers.length; i++) {
        var key = headers[i]; // key es minúscula (ej: 'name', 'isfeatured')
        
        if (key === 'createdat') {
          newRow.push(new Date().toISOString());
        } else if (key === 'isfeatured') {
           // Buscamos en el payload usando la key camelCase original si es necesario, o minúscula
           var val = p['isFeatured'] || p['isfeatured'];
           newRow.push((val === true || val === "TRUE" || val === "true") ? "TRUE" : "FALSE");
        } else {
          // Intentamos leer del payload con varias variaciones por seguridad
          var val = p[key] || p[convertHeaderToCamel(key)]; 
          newRow.push(val !== undefined ? val : "");
        }
      }
      
      sheet.appendRow(newRow);
      return successResponse({ action: 'create' });
    }

    // --- UPDATE (ACTUALIZAR) ---
    if (action === 'update') {
      var id = String(requestData.id).trim();

      for (var i = 1; i < data.length; i++) {
        if (String(data[i][idIndex]).trim() === id) { 
          var p = requestData.data;
          var updatedRow = [];
          
          for (var k = 0; k < headers.length; k++) {
            var key = headers[k]; // minúscula
            
            if (key === 'createdat') {
              updatedRow.push(data[i][k]); 
            } else if (key === 'isfeatured') {
               var val = p['isFeatured'] || p['isfeatured'];
               updatedRow.push((val === true || val === "TRUE" || val === "true") ? "TRUE" : "FALSE");
            } else {
               // Mapeo inteligente de claves
               var camelKey = convertHeaderToCamel(key); 
               var val = p[key] !== undefined ? p[key] : (p[camelKey] !== undefined ? p[camelKey] : undefined);
               updatedRow.push(val !== undefined ? val : data[i][k]);
            }
          }
          
          sheet.getRange(i + 1, 1, 1, updatedRow.length).setValues([updatedRow]);
          return successResponse({ action: 'update' });
        }
      }
      return errorResponse('ID no encontrado');
    }

    // --- DELETE (BORRAR) ---
    if (action === 'delete') {
      var id = String(requestData.id).trim();

      for (var i = 1; i < data.length; i++) {
        if (String(data[i][idIndex]).trim() === id) {
          sheet.deleteRow(i + 1);
          return successResponse({ action: 'delete', id: id });
        }
      }
      return errorResponse('ID no encontrado');
    }

  } catch (e) {
    return errorResponse(e.toString());
  } finally {
    lock.releaseLock();
  }
}

// Helper simple para intentar recuperar camelCase de claves comunes si es necesario
function convertHeaderToCamel(h) {
    if(h === 'isfeatured') return 'isFeatured';
    if(h === 'createdat') return 'createdAt';
    return h; 
}

function successResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(Object.assign({ status: 'success' }, data)))
        .setMimeType(ContentService.MimeType.JSON);
}

function errorResponse(msg) {
  return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: msg }))
      .setMimeType(ContentService.MimeType.JSON);
}
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    if (!url.includes('script.google.com')) {
      alert('Por favor ingresa una URL válida de Google Apps Script');
      return;
    }
    localStorage.setItem('floor_depot_sheet_url', url);
    onSave();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
      <div className="max-w-3xl w-full bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-slate-700">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-primary p-3 rounded-lg">
              <Database className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Conexión Base de Datos (v13)</h1>
              <p className="text-slate-400 text-sm">Versión Final: Normalización de Datos y Filtro Destacados.</p>
            </div>
          </div>

          <div className="space-y-6">
            
            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
              <h3 className="font-bold text-lg mb-2 flex items-center gap-2 text-emerald-400">
                <span className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-sm border border-slate-600">1</span>
                Copiar Script v13
              </h3>
              <p className="text-slate-300 text-sm mb-3">
                Esta versión soluciona el problema de que los "Destacados" no se vean por diferencias de mayúsculas en la planilla.
              </p>
              
              <div className="relative group">
                <pre className="bg-black/50 p-4 rounded-lg text-[10px] md:text-xs text-emerald-300 font-mono overflow-x-auto h-48 border border-slate-700">
                  {APPS_SCRIPT_CODE}
                </pre>
                <button 
                  onClick={handleCopy}
                  className="absolute top-2 right-2 bg-slate-700 hover:bg-slate-600 text-white p-2 rounded-md transition-colors flex items-center gap-2 text-xs font-bold shadow-lg"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copiado' : 'Copiar'}
                </button>
              </div>
            </div>

            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
              <h3 className="font-bold text-lg mb-2 flex items-center gap-2 text-emerald-400">
                <span className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-sm border border-slate-600">2</span>
                Re-Implementar (OBLIGATORIO)
              </h3>
              <div className="text-slate-300 text-sm space-y-2">
                <p>1. Borra TODO el código viejo y pega el nuevo.</p>
                <p>2. Clic <strong>Implementar</strong> &gt; <strong>Nueva implementación</strong>.</p>
                <p>3. <strong>Quién tiene acceso</strong>: Selecciona <strong className="text-red-400 bg-red-900/20 px-1 rounded">Cualquier usuario (Anyone)</strong>.</p>
                <p>4. Copia la nueva URL y pégala abajo.</p>
              </div>
              
              <div className="flex gap-2 mt-4">
                <input 
                  type="text" 
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/..." 
                  className="flex-1 bg-white text-slate-900 px-4 py-3 rounded-lg text-sm border-2 border-slate-600 focus:border-primary focus:outline-none placeholder-slate-400"
                />
                <button 
                  onClick={handleSave}
                  className="bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-colors shadow-lg shadow-primary/20"
                >
                  <Save className="w-4 h-4" />
                  Guardar
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default SheetConfig;
