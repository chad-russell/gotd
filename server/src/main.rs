// #![feature(test)]

mod squarewordgen;
mod sudokugen;

use axum::{
    async_trait,
    extract::{FromRequestParts, State},
    headers::{authorization::Bearer, Authorization},
    http::{request::Parts, StatusCode},
    response::{IntoResponse, Response},
    routing::{get, post},
    Json, Router, TypedHeader,
};
use chrono::{DateTime, Datelike, NaiveDate, Utc};
use clap::Parser;
use jsonwebtoken::{Algorithm, DecodingKey, EncodingKey, Validation};
use serde::{Deserialize, Serialize};
use sqlx::{
    postgres::{PgConnectOptions, PgPoolOptions},
    PgPool,
};
use tower_http::cors::CorsLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use uuid::Uuid;

use std::{net::SocketAddr, time::Duration};

const SECRET: &str = "secret";

fn midnight_today() -> NaiveDate {
    let now = Utc::now()
        .with_timezone(&chrono_tz::America::New_York)
        .num_days_from_ce();
    NaiveDate::from_num_days_from_ce_opt(now).unwrap()
}

#[derive(Serialize, sqlx::FromRow)]
struct SudokuGame {
    id: Uuid,
    puzzle: String,
    solution: String,
    day: NaiveDate,
    state: Option<String>,
    timestamp: Option<i64>,
    winner: Option<bool>,
}

async fn get_sudoku_state(
    user: User,
    State(state): State<AppState>,
) -> Result<Json<SudokuGame>, (StatusCode, String)> {
    let found_game: Option<SudokuGame> =
        sqlx::query_as("select p.id, p.puzzle, p.solution, p.day, s.state, s.timestamp, s.winner from sudoku_puzzles p left join sudoku_scores s on s.puzzle_id=p.id and s.user_id = $1 where day = $2")
            .bind(&user.id)
            .bind(&midnight_today())
            .fetch_optional(&state.pool)
            .await
            .map_err(|e| {
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    format!("Failed querying sudoku puzzle: {}", e.to_string()),
                )
            })?;

    match found_game {
        Some(found_game) => Ok(Json(found_game)),
        None => {
            let generated = if state.args.test_sudoku {
                sudokugen::Sudoku {
                puzzle: "4289751633761289459513642788197536242678415395342968-7-425873967836-945269543278-",
                solution: "428975163376128945951364278819753624267841539534296817142587396783619452695432781",
                difficulty: sudokugen::Difficulty::Medium,
            }
            } else {
                sudokugen::generate(sudokugen::Difficulty::Medium)
            };

            let new_id = Uuid::new_v4();

            sqlx::query(
                "insert into sudoku_puzzles (id, puzzle, solution, day) values ($1, $2, $3, $4)",
            )
            .bind(&new_id)
            .bind(&generated.puzzle)
            .bind(&generated.solution)
            .bind(&midnight_today())
            .execute(&state.pool)
            .await
            .map_err(|e| {
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    format!("Failed saving sudoku puzzle: {}", e.to_string()),
                )
            })?;

            Ok(Json(SudokuGame {
                id: new_id,
                puzzle: generated.puzzle.to_string(),
                solution: generated.solution.to_string(),
                day: midnight_today(),
                state: None,
                timestamp: None,
                winner: Some(false),
            }))
        }
    }
}

#[derive(Deserialize)]
struct SaveSudokuStateRequest {
    puzzle_id: Uuid,
    state: Option<String>,
    timestamp: i64,
    winner: bool,
}

async fn save_sudoku_state(
    user: User,
    State(state): State<AppState>,
    Json(request): Json<SaveSudokuStateRequest>,
) -> Result<(), (StatusCode, String)> {
    sqlx::query(
        "
            insert into sudoku_scores (id, user_id, puzzle_id, state, timestamp, winner) values ($1, $2, $3, $4, $5, $6) 
            on conflict on constraint sudoku_scores_user_id_puzzle_id_key do update set state = $4, timestamp = $5, winner = $6
            where not exists (select 1 from sudoku_scores where user_id = $2 and puzzle_id = $3 and winner = true)
        ",
    )
    .bind(&Uuid::new_v4())
    .bind(&user.id)
    .bind(&request.puzzle_id)
    .bind(&request.state)
    .bind(&request.timestamp)
    .bind(&request.winner)
    .execute(&state.pool)
    .await
    .map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed saving sudoku score: {}", e.to_string()),
        )
    })?;

    Ok(())
}

#[derive(Serialize, sqlx::FromRow)]
struct SquarewordGame {
    id: Uuid,
    solution: String,
    day: NaiveDate,
    state: Option<String>,
    timestamp: Option<i64>,
    winner: Option<bool>,
}

async fn get_squareword_state(
    user: User,
    State(state): State<AppState>,
) -> Result<Json<SquarewordGame>, (StatusCode, String)> {
    let found_game: Option<SquarewordGame> =
        sqlx::query_as("select p.id, p.solution, p.day, s.state, s.timestamp, s.winner from squareword_puzzles p left join squareword_scores s on s.puzzle_id=p.id and s.user_id = $1 where p.day = $2")
            .bind(&user.id)
            .bind(&midnight_today())
            .fetch_optional(&state.pool)
            .await
            .map_err(|e| {
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    format!("Failed querying squareword puzzle: {}", e.to_string()),
                )
            })?;

    match found_game {
        Some(found_game) => Ok(Json(found_game)),
        None => {
            let generated = squarewordgen::generate();

            let new_id = Uuid::new_v4();

            sqlx::query("insert into squareword_puzzles (id, solution, day) values ($1, $2, $3)")
                .bind(&new_id)
                .bind(generated)
                .bind(&midnight_today())
                .execute(&state.pool)
                .await
                .map_err(|e| {
                    (
                        StatusCode::INTERNAL_SERVER_ERROR,
                        format!("Failed generating new squareword puzzle: {}", e.to_string()),
                    )
                })?;

            Ok(Json(SquarewordGame {
                id: new_id,
                solution: generated.to_string(),
                day: midnight_today(),
                state: None,
                timestamp: None,
                winner: Some(false),
            }))
        }
    }
}

#[derive(Deserialize)]
struct SaveSquarewordScoreRequest {
    puzzle_id: Uuid,
    state: Option<String>,
    timestamp: i64,
    winner: bool,
}

async fn save_squareword_state(
    user: User,
    State(state): State<AppState>,
    Json(request): Json<SaveSquarewordScoreRequest>,
) -> Result<(), (StatusCode, String)> {
    sqlx::query(
        "
            insert into squareword_scores (id, user_id, puzzle_id, state, timestamp, winner) values ($1, $2, $3, $4, $5, $6) 
            on conflict on constraint squareword_scores_user_id_puzzle_id_key do update set state = $4, timestamp=$5, winner=$6
            where not exists (select 1 from squareword_scores where user_id = $2 and puzzle_id = $3 and winner = true)
        ",
    )
    .bind(&Uuid::new_v4())
    .bind(&user.id)
    .bind(&request.puzzle_id)
    .bind(&request.state)
    .bind(&request.timestamp)
    .bind(&request.winner)
    .execute(&state.pool)
    .await
    .map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed saving sudoku score: {}", e.to_string()),
        )
    })?;

    Ok(())
}

#[derive(sqlx::FromRow, Serialize, Deserialize, Debug)]
struct User {
    id: Uuid,
    name: String,
    email: String,
    picture: Option<String>,
    created_at: DateTime<Utc>,
    last_login: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
struct GoogleJwt {
    iss: String,
    aud: String,
    sub: String,
    email: String,
    email_verified: bool,
    name: String,
    picture: Option<String>,
    given_name: String,
    family_name: String,
    iat: i64,
    exp: i64,
    jti: String,
}

#[derive(Deserialize)]
struct GoogleCert {
    kid: String,
    e: String,
    n: String,
}

#[derive(Deserialize)]
struct GoogleCerts {
    keys: Vec<GoogleCert>,
}

#[derive(Deserialize)]
struct LoginRequest {
    token: String,
}

async fn login(
    State(state): State<AppState>,
    Json(req): Json<LoginRequest>,
) -> Result<String, (StatusCode, String)> {
    let header = jsonwebtoken::decode_header(&req.token).unwrap();
    let kid = match header.kid {
        Some(k) => k,
        None => todo!(),
    };

    let client = reqwest::Client::new();
    let res = client
        .get("https://www.googleapis.com/oauth2/v3/certs")
        .send()
        .await.map_err(|e| (StatusCode::SERVICE_UNAVAILABLE, format!("Failed to query 'https://www.googleapis.com/oauth2/v3/certs' for certs: {:?}", e)))?
        .json::<GoogleCerts>()
        .await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to decode 'https://www.googleapis.com/oauth2/v3/certs' cert response: {:?}", e)))?;

    let key = res.keys.iter().find(|k| k.kid == kid).unwrap();

    let token = jsonwebtoken::decode::<GoogleJwt>(
        &req.token,
        &DecodingKey::from_rsa_components(&key.n, &key.e).unwrap(),
        &Validation::new(Algorithm::RS256),
    )
    .map_err(|e| {
        (
            StatusCode::UNAUTHORIZED,
            format!("Failed to decode token: {:?}", e),
        )
    })?;

    // Look for an existing user. If not, create one
    let user: Option<User> = sqlx::query_as("select * from users where email = $1")
        .bind(&token.claims.email)
        .fetch_optional(&state.pool)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // Save the user if they don't exist, else create a new one
    let user = match user {
        Some(user) => {
            // Update last login time
            sqlx::query("update users set last_login = $1 where id = $2")
                .bind(&Utc::now())
                .bind(&user.id)
                .execute(&state.pool)
                .await
                .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

            user
        }
        None => {
            let user = User {
                id: Uuid::new_v4(),
                name: token.claims.name.clone(),
                email: token.claims.email.clone(),
                picture: token.claims.picture.clone(),
                created_at: Utc::now(),
                last_login: Utc::now(),
            };

            sqlx::query("insert into users (id, name, email, picture, created_at, last_login) values ($1, $2, $3, $4, $5, $6)")
                .bind(&user.id)
                .bind(&user.name)
                .bind(&user.email)
                .bind(&(user.picture.clone().unwrap_or_else(|| "".to_string())))
                .bind(&user.created_at)
                .bind(&user.last_login)
                .execute(&state.pool)
                .await
                .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

            user
        }
    };

    let token = jsonwebtoken::encode(
        &jsonwebtoken::Header::default(),
        &user,
        &EncodingKey::from_secret(SECRET.as_ref()),
    )
    .unwrap();

    Ok(token)
}

#[async_trait]
impl<S> FromRequestParts<S> for User
where
    S: Send + Sync,
{
    type Rejection = Response;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let TypedHeader(Authorization(token)) =
            TypedHeader::<Authorization<Bearer>>::from_request_parts(parts, state)
                .await
                .map_err(|e| e.into_response())?;

        let mut validation = Validation::new(Algorithm::HS256);
        validation.validate_exp = false;
        validation.required_spec_claims.clear();
        let token_user = jsonwebtoken::decode::<User>(
            &token.token(),
            &DecodingKey::from_secret(SECRET.as_ref()),
            &validation,
        )
        .map_err(|e| {
            Response::builder()
                .status(StatusCode::UNAUTHORIZED)
                .body(format!("Failed to decode token: {:?}", e))
                .unwrap()
                .into_response()
        })?;

        Ok(token_user.claims)
    }
}

async fn check_auth(user: User) -> Result<String, (StatusCode, String)> {
    Ok(format!("{:?}", user))
}

async fn pong() -> String {
    return "pong\n".to_string();
}

#[derive(Serialize)]
struct LeaderboardUser {
    name: String,
    picture: Option<String>,
    sudoku_score: i32,
    squareword_score: i32,
}

#[derive(Serialize)]
struct LeaderboardResponse {
    users: Vec<LeaderboardUser>,
}

async fn leaderboard() -> Result<Json<LeaderboardResponse>, (StatusCode, String)> {
    Ok(Json(LeaderboardResponse {
        users: vec![
            LeaderboardUser {
                name: "Test User".to_string(),
                picture: None,
                sudoku_score: 150,
                squareword_score: 300,
            },
            LeaderboardUser {
                name: "Test User 2".to_string(),
                picture: None,
                sudoku_score: 200,
                squareword_score: 85,
            },
        ],
    }))
}

#[derive(Parser, Debug, Clone)]
struct Args {
    #[arg(long, default_value = "localhost")]
    db_host: String,

    #[arg(long, default_value = "gotd")]
    db_name: String,

    #[arg(long, default_value = "false")]
    test_sudoku: bool,
}

#[derive(Clone)]
struct AppState {
    pool: PgPool,
    args: Args,
}

#[tokio::main]
async fn main() {
    let args = Args::parse();

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
                .username("admin")
                .password("pgpass")
                .host(&args.db_host)
                .port(5432)
                .database(&args.db_name),
        )
        .await
        .expect("can't connect to database");

    let app = Router::new()
        .route("/ping", get(pong))
        .route("/sudoku/state", get(get_sudoku_state))
        .route("/sudoku/state", post(save_sudoku_state))
        .route("/squareword/state", get(get_squareword_state))
        .route("/squareword/state", post(save_squareword_state))
        .route("/login", post(login))
        .route("/leaderboard", get(leaderboard))
        .route("/check_auth", get(check_auth))
        .layer(CorsLayer::permissive())
        .with_state(AppState { pool, args });

    let addr = SocketAddr::from(([0, 0, 0, 0], 3001));

    tracing::debug!("listening on {}", addr);

    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
}
