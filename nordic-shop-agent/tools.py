import httpx
from config import NORDIC_API_URL

async def search_products(query: str):
    async with httpx.AsyncClient() as client:
        r = await client.get(f"{NORDIC_API_URL}/api/search", params={"q": query})
        return r.json()

async def get_product(product_id: str):
    async with httpx.AsyncClient() as client:
        r = await client.get(f"{NORDIC_API_URL}/api/products/{product_id}")
        return r.json()

async def recommend_products(product_id: str):
    async with httpx.AsyncClient() as client:
        r = await client.get(f"{NORDIC_API_URL}/api/similar/{product_id}")
        return r.json()

TOOLS_SCHEMA = [
    {
        "name": "search_products",
        "description": "Search Nordic Shop products by keyword or description",
        "input_schema": {
            "type": "object",
            "properties": {"query": {"type": "string"}},
            "required": ["query"]
        }
    },
    {
        "name": "get_product",
        "description": "Get full details for a single product by its ID",
        "input_schema": {
            "type": "object",
            "properties": {"product_id": {"type": "string"}},
            "required": ["product_id"]
        }
    },
    {
        "name": "recommend_products",
        "description": "Get products similar to a given product ID",
        "input_schema": {
            "type": "object",
            "properties": {"product_id": {"type": "string"}},
            "required": ["product_id"]
        }
    }
]