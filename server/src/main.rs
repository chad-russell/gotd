#![feature(test)]

use axum::{extract::State, http::StatusCode, routing::get, Json, Router};
use sqlx::postgres::{PgConnectOptions, PgPool, PgPoolOptions, PgSslMode};
use sudokugen::Sudoku;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use std::{net::SocketAddr, time::Duration};

pub mod migrations;
pub mod squarewordgen;
pub mod sudokugen;

type Error = Box<dyn std::error::Error + Send + Sync + 'static>;

async fn sudoku_today() -> Json<Sudoku> {
    Json(sudokugen::generate(sudokugen::Difficulty::Medium))
}

async fn squareword_today() -> Json<String> {
    Json(squarewordgen::generate().to_string())
}

async fn using_connection_pool_extractor(
    State(pool): State<PgPool>,
) -> Result<String, (StatusCode, String)> {
    sqlx::query_scalar("select 'hello world from pg'")
        .fetch_one(&pool)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))
}

#[tokio::main]
async fn main() {
    migrations::run_migrations().await.unwrap();

    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "gotd=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    let pool = PgPoolOptions::new()
        .max_connections(5)
        .acquire_timeout(Duration::from_secs(30))
        .connect_with(
            PgConnectOptions::new()
                .username("doadmin")
                .password("AVNS_qgKtUh7sZdZG2fbpl6q")
                .host("db-postgresql-nyc1-47255-do-user-14375111-0.b.db.ondigitalocean.com")
                .port(25060)
                .database("foo")
                .ssl_mode(PgSslMode::Require)
                .ssl_root_cert("./db-certificate.crt"),
        )
        .await
        .expect("can't connect to database");

    let app = Router::new()
        .route(
            "/",
            get(using_connection_pool_extractor).post(using_connection_pool_extractor),
        )
        .route("/sudoku/today", get(sudoku_today))
        .route("/squareword/today", get(squareword_today))
        .with_state(pool);

    let addr = SocketAddr::from(([127, 0, 0, 1], 3001));

    tracing::debug!("listening on {}", addr);

    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
}
