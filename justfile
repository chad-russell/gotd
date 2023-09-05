db-migrate:
    sqlx migrate run --database-url "postgresql://doadmin:AVNS_qgKtUh7sZdZG2fbpl6q@db-postgresql-nyc1-47255-do-user-14375111-0.b.db.ondigitalocean.com:25060/gotd?sslmode=require"

db-revert:
    sqlx migrate revert --database-url "postgresql://doadmin:AVNS_qgKtUh7sZdZG2fbpl6q@db-postgresql-nyc1-47255-do-user-14375111-0.b.db.ondigitalocean.com:25060/gotd?sslmode=require"

