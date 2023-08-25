use openssl::ssl::{SslConnector, SslMethod};
use postgres_openssl::MakeTlsConnector;

use crate::Error;

mod embedded {
    use refinery::embed_migrations;
    embed_migrations!("../migrations");
}

pub async fn run_migrations() -> std::result::Result<(), Error> {
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
