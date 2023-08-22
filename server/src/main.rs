use askama::Template;
use axum::{
    async_trait,
    extract::{FromRef, FromRequestParts, State},
    http::{request::Parts, StatusCode},
    response::{Html, IntoResponse},
    routing::get,
    Router,
};
use openssl::ssl::{SslConnector, SslMethod};
use postgres_openssl::MakeTlsConnector;
use sqlx::postgres::{PgConnectOptions, PgPool, PgPoolOptions, PgSslMode};
use tokio::net::TcpListener;
use tower_http::services::ServeDir;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use std::{net::SocketAddr, time::Duration};

type Error = Box<dyn std::error::Error + Send + Sync + 'static>;

mod embedded {
    use refinery::embed_migrations;
    embed_migrations!("../migrations");
}

async fn run_migrations() -> std::result::Result<(), Error> {
    println!("Running DB migrations...");

    let mut builder = SslConnector::builder(SslMethod::tls())?;
    builder.set_ca_file("db-certificate.crt")?;
    let connector = MakeTlsConnector::new(builder.build());

    let (mut client, con) = tokio_postgres::connect(
        "host=db-postgresql-nyc1-47255-do-user-14375111-0.b.db.ondigitalocean.com user=doadmin password=AVNS_qgKtUh7sZdZG2fbpl6q dbname=foo port=25060 sslmode=require",
        connector,
    )
    .await?;

    tokio::spawn(async move {
        if let Err(e) = con.await {
            eprintln!("connection error: {}", e);
        }
    });
    let migration_report = embedded::migrations::runner()
        .run_async(&mut client)
        .await?;

    for migration in migration_report.applied_migrations() {
        println!(
            "Migration Applied -  Name: {}, Version: {}",
            migration.name(),
            migration.version()
        );
    }

    println!("DB migrations finished!");

    Ok(())
}

#[derive(Template)]
#[template(path = "hello.html")]
struct HelloTemplate;

/// A wrapper type that we'll use to encapsulate HTML parsed by askama into valid HTML for axum to serve.
struct HtmlTemplate<T>(T);

/// Allows us to convert Askama HTML templates into valid HTML for axum to serve in the response.
impl<T> IntoResponse for HtmlTemplate<T>
where
    T: Template,
{
    fn into_response(self) -> axum::response::Response {
        // Attempt to render the template with askama
        match self.0.render() {
            // If we're able to successfully parse and aggregate the template, serve it
            Ok(html) => Html(html).into_response(),
            // If we're not, return an error or some bit of fallback HTML
            Err(err) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to render template. Error: {}", err),
            )
                .into_response(),
        }
    }
}

async fn hello_template() -> impl IntoResponse {
    let template = HelloTemplate {};
    HtmlTemplate(template)
}

// we can extract the connection pool with `State`
async fn using_connection_pool_extractor(
    State(pool): State<PgPool>,
) -> Result<String, (StatusCode, String)> {
    sqlx::query_scalar("select 'hello world from pg'")
        .fetch_one(&pool)
        .await
        .map_err(internal_error)
}

// we can also write a custom extractor that grabs a connection from the pool
// which setup is appropriate depends on your application
struct DatabaseConnection(sqlx::pool::PoolConnection<sqlx::Postgres>);

#[async_trait]
impl<S> FromRequestParts<S> for DatabaseConnection
where
    PgPool: FromRef<S>,
    S: Send + Sync,
{
    type Rejection = (StatusCode, String);

    async fn from_request_parts(_parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let pool = PgPool::from_ref(state);

        let conn = pool.acquire().await.map_err(internal_error)?;

        Ok(Self(conn))
    }
}

async fn using_connection_extractor(
    DatabaseConnection(mut conn): DatabaseConnection,
) -> Result<String, (StatusCode, String)> {
    sqlx::query_scalar("select 'hello world from pg'")
        .fetch_one(&mut *conn)
        .await
        .map_err(internal_error)
}

/// Utility function for mapping any error into a `500 Internal Server Error`
/// response.
fn internal_error<E>(err: E) -> (StatusCode, String)
where
    E: std::error::Error,
{
    (StatusCode::INTERNAL_SERVER_ERROR, err.to_string())
}

#[tokio::main]
async fn main() {
    // run_migrations().await.unwrap();

    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "gotd=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    // setup connection pool
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

    let assets_path = std::env::current_dir().unwrap();

    // build our application with some routes
    let app = Router::new()
        // .route(
        //     "/",
        //     get(using_connection_pool_extractor).post(using_connection_extractor),
        // )
        .route("/", get(hello_template))
        .nest_service(
            "/assets",
            ServeDir::new(format!("{}/assets", assets_path.to_str().unwrap())),
        )
        .with_state(pool);

    // run our app with hyper
    let addr = SocketAddr::from(([127, 0, 0, 1], 3001));

    tracing::debug!("listening on {}", addr);

    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
}
