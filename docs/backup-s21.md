# Copias de seguridad — analizador S-21

IndexedDB (`s21_analizador`) es la fuente de verdad. ZIP, carpeta y Gmail son **copias de respaldo**.

## Canales

| Canal | Qué hace | Requisito |
|-------|----------|-----------|
| **ZIP** | Descarga / restaura `s21-backup-*.zip` | JSZip (CDN) |
| **Carpeta** | File System Access + auto-backup al abrir | Chrome / Edge |
| **Gmail** | ZIP como mensaje en el buzón | OAuth Client ID + Gmail API |

UI: Ajustes (engranaje) → **Copia de seguridad**.

## Formato ZIP

| Entrada | Contenido |
|---------|-----------|
| `backup.json` | Payload (`version`, `schemaVersion`, `datasets`, `activeDatasetId`, `prefs`) |
| `manifest.json` | `backupId`, checksum SHA-256, dispositivo, tamaños |
| `files/` | Vacío en S-21 (sin adjuntos de fotos) |

Tag Gmail: `[S21_ANALIZADOR_BACKUP]`.

Preferencias incluidas en `prefs`: tema/fuente, grupos en localStorage, alias de perfiles, chart profiles, export groups.

## Módulos

```
web/backup/          empaquetado, checksum, snapshot, cloudBackup
web/dashboard-backup.js
web/dashboard-auto-backup.js
web/dashboard-data-process.js
web/dashboard-backup-google-ui.js
web/google/          GoogleAuth, GmailClient, mime, GmailBackupProvider
```

## Restaurar

- **Reemplazar:** snapshot previo → wipe → aplicar payload → rollback si falla.
- **Fusionar:** por `dataset.id`; respeta máximo 15 cargas.
- **Gmail:** siempre replace con confirmación.

## Configurar Gmail

1. Google Cloud → habilitar **Gmail API**.
2. OAuth consent (scopes: `openid`, `email`, `gmail.modify`).
3. Credencial web. Orígenes autorizados (sin path):
   - `http://localhost:8000`
   - `https://ronnysandoval.github.io`
4. Copiar Client ID a `web/google-oauth.json` (ver `google-oauth.json.example`) o a `web/google/bundledClientId.js`.

**Error `insufficient authentication scopes`:** el token no incluye Gmail. En la pantalla de consentimiento OAuth añada el scope `https://www.googleapis.com/auth/gmail.modify`, guarde, en la app use **Desconectar** / **Volver a conectar** y acepte el permiso de Gmail (no solo correo/perfil).

Sin Client ID, ZIP y carpeta siguen disponibles.

## Privacidad

La copia contiene datos de congregación. No la suba a repos públicos ni la reenvíe por canales inseguros.

## Checklist manual

- [ ] Descargar ZIP → borrar datos → restaurar replace → mismas cargas
- [ ] Fusionar con id nuevo y duplicado
- [ ] ZIP corrupto rechazado
- [ ] Carpeta vinculada + banner si hay cambios pendientes
- [ ] (Con OAuth) PC sube a Gmail → móvil restaura
