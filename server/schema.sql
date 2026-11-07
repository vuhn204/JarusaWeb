-- ─────────────────────────────────────────────────────────────
-- Jarusa · Esquema SQLite (se aplica al arrancar; idempotente)
-- Persistencia real de: anuncios, precios/descuentos, listas de
-- deseos por usuario y notificaciones (con leído / no leído).
-- ─────────────────────────────────────────────────────────────
PRAGMA foreign_keys = ON;

-- Cuentas conocidas por el servidor (solo correo, nombre y rol; SIN contraseñas).
-- El rol lo decide el servidor: las cuentas nuevas siempre son 'user'.
CREATE TABLE IF NOT EXISTS users (
  email      TEXT PRIMARY KEY COLLATE NOCASE,
  name       TEXT NOT NULL,
  role       TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at INTEGER NOT NULL
);

-- Catálogo: aquí vive el precio oficial (normal) y el precio anterior tachado
CREATE TABLE IF NOT EXISTS products (
  id               TEXT PRIMARY KEY,
  name             TEXT NOT NULL,
  price            REAL NOT NULL CHECK (price > 0),
  old_price        REAL CHECK (old_price IS NULL OR old_price > price),
  price_updated_at INTEGER
);

CREATE TABLE IF NOT EXISTS wishlist_items (
  user_email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  added_at   INTEGER NOT NULL,
  PRIMARY KEY (user_email, product_id)
);
CREATE INDEX IF NOT EXISTS ix_wishlist_product ON wishlist_items (product_id);

CREATE TABLE IF NOT EXISTS announcements (
  id           TEXT PRIMARY KEY,
  kind         TEXT NOT NULL CHECK (kind IN ('novedad', 'anuncio', 'promocion')),
  title        TEXT NOT NULL CHECK (length(title) BETWEEN 3 AND 90),
  body         TEXT NOT NULL CHECK (length(body) BETWEEN 10 AND 1000),
  product_id   TEXT REFERENCES products(id) ON DELETE SET NULL,
  promo_price  REAL CHECK (promo_price IS NULL OR promo_price > 0),
  img          TEXT,
  status       TEXT NOT NULL CHECK (status IN ('borrador', 'publicado', 'archivado')),
  publish_at   TEXT NOT NULL,
  expires_at   TEXT CHECK (expires_at IS NULL OR expires_at > publish_at),
  author_email TEXT NOT NULL REFERENCES users(email),
  author_name  TEXT NOT NULL,
  updated_by   TEXT REFERENCES users(email),
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL,
  CHECK (promo_price IS NULL OR (kind = 'promocion' AND product_id IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS ix_ann_state ON announcements (status, publish_at, expires_at);

-- Una fila por destinatario. dedupe_key + usuario es único: la misma
-- actualización nunca genera dos avisos para la misma cuenta.
CREATE TABLE IF NOT EXISTS notifications (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  user_email      TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
  type            TEXT NOT NULL,
  title           TEXT NOT NULL,
  body            TEXT NOT NULL,
  link            TEXT,
  product_id      TEXT REFERENCES products(id) ON DELETE SET NULL,
  announcement_id TEXT REFERENCES announcements(id) ON DELETE SET NULL,
  old_price       REAL,
  new_price       REAL,
  dedupe_key      TEXT NOT NULL,
  created_at      INTEGER NOT NULL,
  read_at         INTEGER,
  UNIQUE (user_email, dedupe_key)
);
CREATE INDEX IF NOT EXISTS ix_notif_user ON notifications (user_email, created_at DESC);

-- Último precio vigente ya procesado por producto (para detectar rebajas reales)
CREATE TABLE IF NOT EXISTS product_price_state (
  product_id TEXT PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
  price      REAL NOT NULL,
  source     TEXT NOT NULL
);
