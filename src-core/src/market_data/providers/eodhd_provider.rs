use crate::market_data::market_data_model::DataSource;
use crate::market_data::providers::market_data_provider::MarketDataProvider;
use crate::market_data::providers::models::AssetProfile;
use crate::market_data::{AssetProfiler, MarketDataError, Quote as ModelQuote, QuoteSummary};
use async_trait::async_trait;
use chrono::{DateTime, NaiveDate, Utc};
use reqwest::Client;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use std::str::FromStr;
use std::time::SystemTime;

const BASE_URL: &str = "https://eodhistoricaldata.com/api";

pub struct EodhdProvider {
    client: Client,
    token: String,
}

impl EodhdProvider {
    pub fn new(token: String) -> Self {
        let client = Client::new();
        EodhdProvider { client, token }
    }

    async fn fetch_data(&self, endpoint: &str) -> Result<String, MarketDataError> {
        let url = format!("{}{}?api_token={}", BASE_URL, endpoint, self.token);

        let response = self
            .client
            .get(&url)
            .send()
            .await
            .map_err(|e| MarketDataError::ProviderError(format!("EODHD request failed: {}", e)))?;

        if !response.status().is_success() {
            let error_body = response
                .text()
                .await
                .unwrap_or_else(|_| "Unknown error".to_string());
            return Err(MarketDataError::ProviderError(format!(
                "EODHD API error: {}",
                error_body
            )));
        }

        let text = response
            .text()
            .await
            .map_err(|e| MarketDataError::ProviderError(format!("Failed to read response: {}", e)))?;
        Ok(text)
    }
}

#[derive(Debug, Deserialize)]
struct EodhdRealTimeQuote {
    code: String,
    close: f64,
    open: f64,
    high: f64,
    low: f64,
    volume: Option<f64>,
    #[serde(default)]
    timestamp: i64,
}

#[derive(Debug, Deserialize)]
struct EodhdHistoricalQuote {
    date: String,
    open: f64,
    high: f64,
    low: f64,
    close: f64,
    adjusted_close: f64,
    volume: f64,
}

#[derive(Debug, Deserialize)]
struct EodhdSearchResult {
    #[serde(rename = "Code")]
    code: String,
    #[serde(rename = "Name")]
    name: String,
    #[serde(rename = "Exchange")]
    exchange: String,
    #[serde(rename = "Type")]
    asset_type: Option<String>,
    #[serde(rename = "Country")]
    country: Option<String>,
    #[serde(rename = "Currency")]
    currency: Option<String>,
}

#[derive(Debug, Deserialize)]
struct EodhdFundamentals {
    #[serde(rename = "General")]
    general: Option<EodhdGeneral>,
}

#[derive(Debug, Deserialize)]
struct EodhdGeneral {
    #[serde(rename = "Code")]
    code: Option<String>,
    #[serde(rename = "Name")]
    name: Option<String>,
    #[serde(rename = "Exchange")]
    exchange: Option<String>,
    #[serde(rename = "CurrencyCode")]
    currency_code: Option<String>,
    #[serde(rename = "Type")]
    asset_type: Option<String>,
    #[serde(rename = "ISIN")]
    isin: Option<String>,
    #[serde(rename = "Description")]
    description: Option<String>,
    #[serde(rename = "Sector")]
    sector: Option<String>,
    #[serde(rename = "Industry")]
    industry: Option<String>,
}

#[async_trait]
impl MarketDataProvider for EodhdProvider {
    fn name(&self) -> &'static str {
        "EODHD"
    }

    fn priority(&self) -> u8 {
        4
    }

    async fn get_latest_quote(
        &self,
        symbol: &str,
        fallback_currency: String,
    ) -> Result<ModelQuote, MarketDataError> {
        let endpoint = format!("/real-time/{}", symbol);
        let data = self.fetch_data(&endpoint).await?;

        let quote: EodhdRealTimeQuote = serde_json::from_str(&data).map_err(|e| {
            MarketDataError::ProviderError(format!("Failed to parse EODHD real-time quote: {}", e))
        })?;

        let timestamp = if quote.timestamp > 0 {
            DateTime::from_timestamp(quote.timestamp, 0)
                .unwrap_or_else(|| Utc::now())
        } else {
            Utc::now()
        };

        Ok(ModelQuote {
            id: uuid::Uuid::new_v4().to_string(),
            created_at: Utc::now(),
            data_source: DataSource::from("EODHD"),
            timestamp,
            symbol: symbol.to_string(),
            open: Decimal::from_f64_retain(quote.open).unwrap_or_default(),
            high: Decimal::from_f64_retain(quote.high).unwrap_or_default(),
            low: Decimal::from_f64_retain(quote.low).unwrap_or_default(),
            volume: Decimal::from_f64_retain(quote.volume.unwrap_or(0.0)).unwrap_or_default(),
            close: Decimal::from_f64_retain(quote.close).unwrap_or_default(),
            adjclose: Decimal::from_f64_retain(quote.close).unwrap_or_default(),
            currency: fallback_currency,
        })
    }

    async fn get_historical_quotes(
        &self,
        symbol: &str,
        start: SystemTime,
        end: SystemTime,
        fallback_currency: String,
    ) -> Result<Vec<ModelQuote>, MarketDataError> {
        let start_date: DateTime<Utc> = start.into();
        let end_date: DateTime<Utc> = end.into();

        let endpoint = format!(
            "/eod/{}?from={}&to={}",
            symbol,
            start_date.format("%Y-%m-%d"),
            end_date.format("%Y-%m-%d")
        );

        let data = self.fetch_data(&endpoint).await?;

        let quotes: Vec<EodhdHistoricalQuote> = serde_json::from_str(&data).map_err(|e| {
            MarketDataError::ProviderError(format!("Failed to parse EODHD historical quotes: {}", e))
        })?;

        let model_quotes = quotes
            .into_iter()
            .filter_map(|q| {
                let date = NaiveDate::parse_from_str(&q.date, "%Y-%m-%d").ok()?;
                let timestamp = date.and_hms_opt(16, 0, 0)?.and_utc();

                Some(ModelQuote {
                    id: uuid::Uuid::new_v4().to_string(),
                    created_at: Utc::now(),
                    data_source: DataSource::from("EODHD"),
                    timestamp,
                    symbol: symbol.to_string(),
                    open: Decimal::from_f64_retain(q.open).unwrap_or_default(),
                    high: Decimal::from_f64_retain(q.high).unwrap_or_default(),
                    low: Decimal::from_f64_retain(q.low).unwrap_or_default(),
                    volume: Decimal::from_f64_retain(q.volume).unwrap_or_default(),
                    close: Decimal::from_f64_retain(q.close).unwrap_or_default(),
                    adjclose: Decimal::from_f64_retain(q.adjusted_close).unwrap_or_default(),
                    currency: fallback_currency.clone(),
                })
            })
            .collect();

        Ok(model_quotes)
    }

    async fn get_historical_quotes_bulk(
        &self,
        symbols_with_currencies: &[(String, String)],
        start: SystemTime,
        end: SystemTime,
    ) -> Result<(Vec<ModelQuote>, Vec<(String, String)>), MarketDataError> {
        let mut all_quotes = Vec::new();
        let mut failed = Vec::new();

        for (symbol, currency) in symbols_with_currencies {
            match self
                .get_historical_quotes(symbol, start, end, currency.clone())
                .await
            {
                Ok(mut quotes) => all_quotes.append(&mut quotes),
                Err(_) => failed.push((symbol.clone(), currency.clone())),
            }
        }

        Ok((all_quotes, failed))
    }
}

#[async_trait]
impl AssetProfiler for EodhdProvider {
    async fn search_ticker(&self, query: &str) -> Result<Vec<QuoteSummary>, MarketDataError> {
        let endpoint = format!("/search/{}", query);
        let data = self.fetch_data(&endpoint).await?;

        let results: Vec<EodhdSearchResult> = serde_json::from_str(&data).map_err(|e| {
            MarketDataError::ProviderError(format!("Failed to parse EODHD search results: {}", e))
        })?;

        let summaries = results
            .into_iter()
            .take(10) // Limit results
            .map(|r| QuoteSummary {
                exchange: r.exchange.clone(),
                short_name: r.name.clone(),
                quote_type: r.asset_type.clone().unwrap_or_else(|| "Unknown".to_string()),
                symbol: r.code.clone(),
                index: "EODHD".to_string(),
                score: 1.0,
                type_display: r.asset_type.unwrap_or_else(|| "Unknown".to_string()),
                long_name: r.name,
            })
            .collect();

        Ok(summaries)
    }

    async fn get_asset_profile(&self, symbol: &str) -> Result<AssetProfile, MarketDataError> {
        let endpoint = format!("/fundamentals/{}?filter=General", symbol);
        let data = self.fetch_data(&endpoint).await?;

        let fundamentals: EodhdFundamentals = serde_json::from_str(&data).map_err(|e| {
            MarketDataError::ProviderError(format!("Failed to parse EODHD fundamentals: {}", e))
        })?;

        let general = fundamentals
            .general
            .ok_or_else(|| MarketDataError::ProviderError("No general data available".to_string()))?;

        // Build sectors JSON string if available
        let sectors_json = general.sector.map(|s| {
            serde_json::json!([{"name": s, "weight": 100.0}]).to_string()
        });

        Ok(AssetProfile {
            id: None,
            symbol: general.code.unwrap_or_else(|| symbol.to_string()),
            name: general.name,
            currency: general.currency_code.unwrap_or_else(|| "USD".to_string()),
            data_source: "EODHD".to_string(),
            asset_type: general.asset_type,
            isin: general.isin,
            symbol_mapping: None,
            asset_class: None,
            asset_sub_class: None,
            notes: general.description,
            countries: None,
            categories: None,
            classes: None,
            attributes: None,
            sectors: sectors_json,
            url: None,
        })
    }
}
