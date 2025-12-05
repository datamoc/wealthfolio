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

const BASE_URL: &str = "http://api.marketstack.com/v1";

pub struct MarketstackProvider {
    client: Client,
    token: String,
}

impl MarketstackProvider {
    pub fn new(token: String) -> Self {
        let client = Client::new();
        MarketstackProvider { client, token }
    }

    async fn fetch_data(&self, endpoint: &str, extra_params: &str) -> Result<String, MarketDataError> {
        let separator = if extra_params.is_empty() { "" } else { "&" };
        let url = format!(
            "{}{}?access_key={}{}{}",
            BASE_URL, endpoint, self.token, separator, extra_params
        );

        let response = self
            .client
            .get(&url)
            .send()
            .await
            .map_err(|e| {
                MarketDataError::ProviderError(format!("MarketStack request failed: {}", e))
            })?;

        if !response.status().is_success() {
            let error_body = response
                .text()
                .await
                .unwrap_or_else(|_| "Unknown error".to_string());
            return Err(MarketDataError::ProviderError(format!(
                "MarketStack API error: {}",
                error_body
            )));
        }

        let text = response.text().await.map_err(|e| {
            MarketDataError::ProviderError(format!("Failed to read response: {}", e))
        })?;
        Ok(text)
    }
}

#[derive(Debug, Deserialize)]
struct MarketstackResponse {
    data: Vec<MarketstackQuote>,
}

#[derive(Debug, Deserialize)]
struct MarketstackQuote {
    symbol: String,
    date: String,
    open: f64,
    high: f64,
    low: f64,
    close: f64,
    volume: f64,
    adj_close: Option<f64>,
    exchange: Option<String>,
}

#[derive(Debug, Deserialize)]
struct MarketstackTickerResponse {
    data: Vec<MarketstackTicker>,
}

#[derive(Debug, Deserialize)]
struct MarketstackTicker {
    symbol: String,
    name: String,
    stock_exchange: Option<MarketstackExchange>,
}

#[derive(Debug, Deserialize)]
struct MarketstackExchange {
    name: Option<String>,
    acronym: Option<String>,
    mic: Option<String>,
    country: Option<String>,
    currency: Option<String>,
}

#[async_trait]
impl MarketDataProvider for MarketstackProvider {
    fn name(&self) -> &'static str {
        "MARKETSTACK"
    }

    fn priority(&self) -> u8 {
        5
    }

    async fn get_latest_quote(
        &self,
        symbol: &str,
        fallback_currency: String,
    ) -> Result<ModelQuote, MarketDataError> {
        let endpoint = "/eod/latest";
        let params = format!("symbols={}", symbol);
        let data = self.fetch_data(endpoint, &params).await?;

        let response: MarketstackResponse = serde_json::from_str(&data).map_err(|e| {
            MarketDataError::ProviderError(format!(
                "Failed to parse MarketStack latest quote: {}",
                e
            ))
        })?;

        let quote = response
            .data
            .into_iter()
            .next()
            .ok_or_else(|| MarketDataError::ProviderError("No quote data returned".to_string()))?;

        let date = NaiveDate::parse_from_str(&quote.date, "%Y-%m-%dT%H:%M:%S%z")
            .or_else(|_| NaiveDate::parse_from_str(&quote.date, "%Y-%m-%d"))
            .map_err(|e| {
                MarketDataError::ProviderError(format!("Failed to parse date {}: {}", quote.date, e))
            })?;

        let timestamp = date.and_hms_opt(16, 0, 0).unwrap_or_default().and_utc();

        Ok(ModelQuote {
            id: uuid::Uuid::new_v4().to_string(),
            created_at: Utc::now(),
            data_source: DataSource::from("MARKETSTACK"),
            timestamp,
            symbol: quote.symbol.clone(),
            open: Decimal::from_f64_retain(quote.open).unwrap_or_default(),
            high: Decimal::from_f64_retain(quote.high).unwrap_or_default(),
            low: Decimal::from_f64_retain(quote.low).unwrap_or_default(),
            volume: Decimal::from_f64_retain(quote.volume).unwrap_or_default(),
            close: Decimal::from_f64_retain(quote.close).unwrap_or_default(),
            adjclose: Decimal::from_f64_retain(quote.adj_close.unwrap_or(quote.close))
                .unwrap_or_default(),
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

        let endpoint = "/eod";
        let params = format!(
            "symbols={}&date_from={}&date_to={}",
            symbol,
            start_date.format("%Y-%m-%d"),
            end_date.format("%Y-%m-%d")
        );

        let data = self.fetch_data(endpoint, &params).await?;

        let response: MarketstackResponse = serde_json::from_str(&data).map_err(|e| {
            MarketDataError::ProviderError(format!(
                "Failed to parse MarketStack historical quotes: {}",
                e
            ))
        })?;

        let model_quotes = response
            .data
            .into_iter()
            .filter_map(|q| {
                let date = NaiveDate::parse_from_str(&q.date, "%Y-%m-%dT%H:%M:%S%z")
                    .or_else(|_| NaiveDate::parse_from_str(&q.date, "%Y-%m-%d"))
                    .ok()?;
                let timestamp = date.and_hms_opt(16, 0, 0)?.and_utc();

                Some(ModelQuote {
                    id: uuid::Uuid::new_v4().to_string(),
                    created_at: Utc::now(),
                    data_source: DataSource::from("MARKETSTACK"),
                    timestamp,
                    symbol: q.symbol.clone(),
                    open: Decimal::from_f64_retain(q.open).unwrap_or_default(),
                    high: Decimal::from_f64_retain(q.high).unwrap_or_default(),
                    low: Decimal::from_f64_retain(q.low).unwrap_or_default(),
                    volume: Decimal::from_f64_retain(q.volume).unwrap_or_default(),
                    close: Decimal::from_f64_retain(q.close).unwrap_or_default(),
                    adjclose: Decimal::from_f64_retain(q.adj_close.unwrap_or(q.close))
                        .unwrap_or_default(),
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
impl AssetProfiler for MarketstackProvider {
    async fn search_ticker(&self, query: &str) -> Result<Vec<QuoteSummary>, MarketDataError> {
        let endpoint = "/tickers";
        let params = format!("search={}&limit=10", query);
        let data = self.fetch_data(endpoint, &params).await?;

        let response: MarketstackTickerResponse = serde_json::from_str(&data).map_err(|e| {
            MarketDataError::ProviderError(format!(
                "Failed to parse MarketStack search results: {}",
                e
            ))
        })?;

        let summaries = response
            .data
            .into_iter()
            .map(|t| {
                let exchange = t
                    .stock_exchange
                    .as_ref()
                    .and_then(|e| e.acronym.clone().or_else(|| e.name.clone()))
                    .unwrap_or_else(|| "Unknown".to_string());

                QuoteSummary {
                    exchange: exchange,
                    short_name: t.name.clone(),
                    quote_type: "Stock".to_string(),
                    symbol: t.symbol.clone(),
                    index: "MARKETSTACK".to_string(),
                    score: 1.0,
                    type_display: "Stock".to_string(),
                    long_name: t.name,
                }
            })
            .collect();

        Ok(summaries)
    }

    async fn get_asset_profile(&self, symbol: &str) -> Result<AssetProfile, MarketDataError> {
        let endpoint = "/tickers";
        let params = format!("symbols={}", symbol);
        let data = self.fetch_data(endpoint, &params).await?;

        let response: MarketstackTickerResponse = serde_json::from_str(&data).map_err(|e| {
            MarketDataError::ProviderError(format!(
                "Failed to parse MarketStack ticker info: {}",
                e
            ))
        })?;

        let ticker = response
            .data
            .into_iter()
            .next()
            .ok_or_else(|| MarketDataError::ProviderError("No ticker data returned".to_string()))?;

        let exchange_info = ticker.stock_exchange;

        let currency = exchange_info
            .as_ref()
            .and_then(|e| e.currency.clone())
            .unwrap_or_else(|| "USD".to_string());

        Ok(AssetProfile {
            id: None,
            symbol: ticker.symbol.clone(),
            name: Some(ticker.name),
            currency,
            data_source: "MARKETSTACK".to_string(),
            asset_type: Some("Stock".to_string()),
            isin: None,
            symbol_mapping: None,
            asset_class: None,
            asset_sub_class: None,
            notes: None,
            countries: None,
            categories: None,
            classes: None,
            attributes: None,
            sectors: None,
            url: None,
        })
    }
}
