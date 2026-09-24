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

async def check_availability(product_id: str):
    product = await get_product(product_id)
    # Using .get() prevents KeyError if Next.js hasn't populated this field yet
    stock = product.get("stock_quantity", 0) 
    return {
        "in_stock": stock > 0,
        "quantity": stock
    }
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
    },
    {
        "name": "check_availability",
        "description": "Check if a product is in stock and its quantity",
        "input_schema": {
            "type": "object",
            "properties": {"product_id": {"type": "string"}},
            "required": ["product_id"]
        }
    }
]
import asyncio
from tools import search_products, get_product, recommend_products


async def main():
    print("=== search_products ===")
    results = await search_products("Bjorn Table Lamp")
    print(results)

    if results:
        product_id = results[0]["id"]

        print("\n=== get_product ===")
        product = await get_product(product_id)
        print(product)

        print("\n=== recommend_products ===")
        similar = await recommend_products(product_id)
        print(similar)

        print("\n=== check_availability ===")
        availability = await check_availability(product_id)
        print(availability)



if __name__ == "__main__":
    asyncio.run(main())