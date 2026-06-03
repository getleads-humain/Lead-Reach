"""yfinance service - Financial data enrichment from Yahoo Finance."""
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

def get_financial_data(symbol: str, metrics: list = None) -> Dict[str, Any]:
    """Fetch financial KPIs for a given stock symbol using yfinance."""
    try:
        import yfinance as yf
    except ImportError:
        return {"error": "yfinance not installed", "data_source": "yfinance"}

    if metrics is None:
        metrics = ["market_cap", "revenue", "employees", "pe_ratio", "sector", "growth_5y"]

    try:
        ticker = yf.Ticker(symbol)
        info = ticker.info or {}

        result = {
            "symbol": symbol,
            "company_name": info.get("longName") or info.get("shortName") or symbol,
            "sector": info.get("sector", ""),
            "industry": info.get("industry", ""),
            "data_source": "yfinance",
        }

        if "market_cap" in metrics:
            mc = info.get("marketCap")
            if mc:
                if mc >= 1e12:
                    result["market_cap"] = f"{mc/1e12:.2f}T"
                elif mc >= 1e9:
                    result["market_cap"] = f"{mc/1e9:.2f}B"
                elif mc >= 1e6:
                    result["market_cap"] = f"{mc/1e6:.2f}M"
                else:
                    result["market_cap"] = str(mc)
            else:
                result["market_cap"] = None

        if "revenue" in metrics:
            rev = info.get("totalRevenue")
            if rev:
                if rev >= 1e9:
                    result["revenue_ttm"] = f"{rev/1e9:.1f}B"
                elif rev >= 1e6:
                    result["revenue_ttm"] = f"{rev/1e6:.1f}M"
                else:
                    result["revenue_ttm"] = str(rev)
            else:
                result["revenue_ttm"] = None

        if "employees" in metrics:
            result["employees"] = info.get("fullTimeEmployees")

        if "pe_ratio" in metrics:
            result["pe_ratio"] = info.get("trailingPE") or info.get("forwardPE")

        if "sector" in metrics and "sector" not in result:
            result["sector"] = info.get("sector")

        if "growth_5y" in metrics:
            try:
                hist = ticker.history(period="5y")
                if len(hist) >= 2:
                    start_price = hist["Close"].iloc[0]
                    end_price = hist["Close"].iloc[-1]
                    if start_price > 0:
                        growth = ((end_price / start_price) ** (1/5) - 1) * 100
                        result["growth_5y"] = f"{growth:.1f}%"
            except Exception:
                result["growth_5y"] = None

        result["website"] = info.get("website")
        result["country"] = info.get("country")
        result["city"] = info.get("city")
        result["phone"] = info.get("phone")
        result["description"] = info.get("longBusinessSummary", "")[:500] if info.get("longBusinessSummary") else None

        return result

    except Exception as e:
        logger.error(f"yfinance error for {symbol}: {e}")
        return {"error": str(e), "symbol": symbol, "data_source": "yfinance"}
