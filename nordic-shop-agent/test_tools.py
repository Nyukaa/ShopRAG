import asyncio
from tools import search_products, get_product, recommend_products


async def main():
    print("=== search_products ===")
    results = await search_products("waterproof jacket")
    print(results)

    if results:
        product_id = results[0]["id"]

        print("\n=== get_product ===")
        product = await get_product(product_id)
        print(product)

        print("\n=== recommend_products ===")
        similar = await recommend_products(product_id)
        print(similar)


if __name__ == "__main__":
    asyncio.run(main())